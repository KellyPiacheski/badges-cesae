// client/src/app/admin/events/[id]/page.tsx
// Detalhe do evento — info + participantes + presenças + avaliações + importação CSV

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/services/api';

interface ParticipantInfo {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
}

interface EnrollmentItem {
  id: number;
  status: 'inscrito' | 'presente' | 'ausente';
  evaluation_score: number | null;
  evaluation_result: 'aprovado' | 'reprovado' | null;
  enrolled_at: string;
  participant: ParticipantInfo;
}

interface EventDetail {
  id: number;
  title: string;
  description: string | null;
  type: 'evento' | 'curso';
  start_date: string;
  end_date: string | null;
  location: string | null;
  duration_hours: number | null;
  category: string | null;
  creator: { id: number; name: string } | null;
  enrollments: EnrollmentItem[];
}

interface EmitResult {
  message: string;
  total: number;
  badges: number;
  certificates: number;
  errors?: { enrollmentId: number; error: string }[];
}

interface EmailResult {
  message: string;
  enviados: number;
  falhados: number;
  total: number;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Detectar separador (vírgula ou ponto-e-vírgula)
  const separator = lines[0].includes(';') ? ';' : ',';

  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Mapear variações comuns de nomes de colunas
    const mapped: Record<string, string> = {
      name: row['name'] || row['nome'] || row['nome completo'] || '',
      email: row['email'] || row['e-mail'] || row['mail'] || '',
      phone: row['phone'] || row['telefone'] || row['telemovel'] || row['telemóvel'] || '',
      organization: row['organization'] || row['organização'] || row['organizacao'] || row['empresa'] || '',
    };

    if (mapped.name && mapped.email) {
      rows.push(mapped);
    }
  }

  return rows;
}

export default function EventDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulário de novo participante
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', phone: '', organization: '' });
  const [addError, setAddError] = useState('');

  // Importação CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors?: string[] } | null>(null);

  // Emissão de badges/certificados
  const [emitLoading, setEmitLoading] = useState(false);
  const [emitResult, setEmitResult] = useState<EmitResult | null>(null);
  const [emitError, setEmitError] = useState('');

  // Envio de emails
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (token && params.id) loadEvent();
  }, [token, params.id]);

  async function loadEvent() {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${params.id}`, { token: token! });
      setEvent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAttendance(enrollmentId: number, status: 'presente' | 'ausente') {
    try {
      await apiFetch(`/enrollments/${enrollmentId}/attendance`, {
        method: 'PATCH',
        token: token!,
        body: JSON.stringify({ status }),
      });
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleEvaluation(enrollmentId: number, score: string, result: string) {
    try {
      await apiFetch(`/enrollments/${enrollmentId}/evaluation`, {
        method: 'PATCH',
        token: token!,
        body: JSON.stringify({
          evaluation_score: score ? parseFloat(score) : null,
          evaluation_result: result || null,
        }),
      });
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddParticipant() {
    if (!newParticipant.name || !newParticipant.email) {
      setAddError('Nome e email são obrigatórios');
      return;
    }

    try {
      setAddError('');
      await apiFetch(`/events/${params.id}/participants`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify(newParticipant),
      });
      setNewParticipant({ name: '', email: '', phone: '', organization: '' });
      setShowAddForm(false);
      loadEvent();
    } catch (err: any) {
      setAddError(err.message);
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const participants = parseCSV(text);

      if (participants.length === 0) {
        setImportResult({ added: 0, skipped: 0, errors: ['Ficheiro vazio ou formato inválido. Use colunas: name/nome, email, phone/telefone, organization/organização'] });
        setImporting(false);
        return;
      }

      const data = await apiFetch(`/events/${params.id}/participants/import`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ participants }),
      });

      setImportResult(data);
      loadEvent();
    } catch (err: any) {
      setImportResult({ added: 0, skipped: 0, errors: [err.message] });
    } finally {
      setImporting(false);
      // Reset do input para permitir reimportação do mesmo ficheiro
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveParticipant(enrollmentId: number, name: string) {
    if (!confirm(`Remover "${name}" deste evento?`)) return;

    try {
      await apiFetch(`/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        token: token!,
      });
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleEmit() {
    setEmitLoading(true);
    setEmitResult(null);
    setEmitError('');
    try {
      const data: EmitResult = await apiFetch(`/events/${params.id}/emit`, {
        method: 'POST',
        token: token!,
      });
      setEmitResult(data);
    } catch (err: any) {
      setEmitError(err.message || 'Erro ao emitir badges/certificados');
    } finally {
      setEmitLoading(false);
    }
  }

  async function handleSendEmails() {
    setEmailLoading(true);
    setEmailResult(null);
    setEmailError('');
    try {
      const data: EmailResult = await apiFetch(`/events/${params.id}/send-emails`, {
        method: 'POST',
        token: token!,
      });
      setEmailResult(data);
    } catch (err: any) {
      setEmailError(err.message || 'Erro ao enviar emails');
    } finally {
      setEmailLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  if (loading) return <div className="text-gray-400">A carregar...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event) return <div className="text-gray-400">Evento não encontrado</div>;

  const presentCount = event.enrollments.filter(e => e.status === 'presente').length;
  const approvedCount = event.enrollments.filter(e => e.evaluation_result === 'aprovado').length;
  const eligibleCount = event.type === 'evento' ? presentCount : approvedCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/events" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Voltar aos eventos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
              event.type === 'evento' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {event.type === 'evento' ? 'Evento' : 'Curso'}
            </span>
            {event.category && (
              <span className="text-sm text-gray-500">{event.category}</span>
            )}
          </div>
        </div>
        <Link
          href={`/admin/events/${event.id}/edit`}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Editar
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Data</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date && ` — ${formatDate(event.end_date)}`}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Local</p>
          <p className="text-sm font-medium text-gray-900">{event.location || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Duração</p>
          <p className="text-sm font-medium text-gray-900">{event.duration_hours ? `${event.duration_hours}h` : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Inscritos / Presentes</p>
          <p className="text-sm font-medium text-gray-900">{event.enrollments.length} / {presentCount}</p>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h2>
          <p className="text-sm text-gray-600">{event.description}</p>
        </div>
      )}

      {/* Emit & Email Actions */}
      {event.enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Emissão de certificados</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {eligibleCount > 0
                  ? `${eligibleCount} participante${eligibleCount !== 1 ? 's' : ''} elegível${eligibleCount !== 1 ? 'eis' : ''} para emissão`
                  : event.type === 'evento'
                    ? 'Nenhum participante com presença confirmada'
                    : 'Nenhum participante aprovado'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEmit}
                disabled={emitLoading || eligibleCount === 0}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {emitLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A emitir...
                  </>
                ) : (
                  <>🎖️ Emitir badges</>
                )}
              </button>
              <button
                onClick={handleSendEmails}
                disabled={emailLoading || eligibleCount === 0}
                className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {emailLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A enviar...
                  </>
                ) : (
                  <>✉️ Enviar emails</>
                )}
              </button>
            </div>
          </div>

          {/* Emit result */}
          {emitResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 mb-2">
              <p className="font-medium">
                {emitResult.badges} badge{emitResult.badges !== 1 ? 's' : ''} e {emitResult.certificates} certificado{emitResult.certificates !== 1 ? 's' : ''} emitidos (de {emitResult.total} elegíveis)
              </p>
              {emitResult.errors && emitResult.errors.length > 0 && (
                <ul className="mt-1 text-xs space-y-0.5 text-green-700">
                  {emitResult.errors.map((e, i) => (
                    <li key={i}>• Enrollment {e.enrollmentId}: {e.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {emitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-2">
              {emitError}
            </div>
          )}

          {/* Email result */}
          {emailResult && (
            <div className={`border rounded-lg px-4 py-3 text-sm ${
              emailResult.falhados > 0
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <p className="font-medium">
                {emailResult.enviados} email{emailResult.enviados !== 1 ? 's' : ''} enviado{emailResult.enviados !== 1 ? 's' : ''}
                {emailResult.falhados > 0 && `, ${emailResult.falhados} falhado${emailResult.falhados !== 1 ? 's' : ''}`}
                {' '}(de {emailResult.total})
              </p>
            </div>
          )}
          {emailError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {emailError}
            </div>
          )}
        </div>
      )}

      {/* Participants Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Participantes ({event.enrollments.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* Botão Importar CSV */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {importing ? 'A importar...' : '📄 Importar CSV'}
            </button>
            {/* Botão Adicionar */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {/* Import Result Message */}
        {importResult && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${
            importResult.errors && importResult.errors.length > 0 && importResult.added === 0
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            <p className="font-medium">
              {importResult.added > 0
                ? `${importResult.added} participante(s) adicionado(s)`
                : 'Nenhum participante adicionado'}
              {importResult.skipped > 0 && `, ${importResult.skipped} ignorado(s) (duplicados ou inválidos)`}
            </p>
            {importResult.errors && importResult.errors.length > 0 && (
              <ul className="mt-1 text-xs space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setImportResult(null)}
              className="text-xs underline mt-1 opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}

        {/* CSV Format Help */}
        {importResult?.errors && importResult.added === 0 && (
          <div className="mx-6 mt-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">Formato esperado do CSV:</p>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              name;email;phone;organization<br />
              Ana Silva;ana@email.com;912345678;Empresa X<br />
              Carlos Mendes;carlos@email.com;;Empresa Y
            </code>
            <p className="text-xs mt-1 opacity-70">Aceita separador vírgula (,) ou ponto-e-vírgula (;). Colunas aceites: name/nome, email, phone/telefone, organization/organização/empresa.</p>
          </div>
        )}

        {/* Add Participant Form */}
        {showAddForm && (
          <div className="p-6 bg-blue-50 border-b border-gray-200">
            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                {addError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                placeholder="Nome *"
                value={newParticipant.name}
                onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                placeholder="Email *"
                type="email"
                value={newParticipant.email}
                onChange={e => setNewParticipant({ ...newParticipant, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                placeholder="Telefone"
                value={newParticipant.phone}
                onChange={e => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                placeholder="Organização"
                value={newParticipant.organization}
                onChange={e => setNewParticipant({ ...newParticipant, organization: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddParticipant}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                Adicionar
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddError(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Participants Table */}
        {event.enrollments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Nenhum participante inscrito.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Presença</th>
                {event.type === 'curso' && (
                  <>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nota</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Resultado</th>
                  </>
                )}
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {event.enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{enrollment.participant.name}</p>
                    {enrollment.participant.organization && (
                      <p className="text-xs text-gray-400">{enrollment.participant.organization}</p>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{enrollment.participant.email}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAttendance(enrollment.id, 'presente')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          enrollment.status === 'presente'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                        }`}
                      >
                        Presente
                      </button>
                      <button
                        onClick={() => handleAttendance(enrollment.id, 'ausente')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          enrollment.status === 'ausente'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        Ausente
                      </button>
                    </div>
                  </td>
                  {event.type === 'curso' && (
                    <>
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          defaultValue={enrollment.evaluation_score ?? ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== String(enrollment.evaluation_score ?? '')) {
                              const result = val && parseFloat(val) >= 10 ? 'aprovado' : val ? 'reprovado' : '';
                              handleEvaluation(enrollment.id, val, result);
                            }
                          }}
                          className="w-16 text-center px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-6 py-3 text-center">
                        {enrollment.evaluation_result ? (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            enrollment.evaluation_result === 'aprovado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {enrollment.evaluation_result === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleRemoveParticipant(enrollment.id, enrollment.participant.name)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary for courses */}
        {event.type === 'curso' && event.enrollments.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-6 text-sm">
            <span className="text-gray-500">
              Presentes: <strong className="text-gray-900">{presentCount}/{event.enrollments.length}</strong>
            </span>
            <span className="text-gray-500">
              Aprovados: <strong className="text-green-700">{approvedCount}</strong>
            </span>
            <span className="text-gray-500">
              Reprovados: <strong className="text-red-700">{event.enrollments.filter(e => e.evaluation_result === 'reprovado').length}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
