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

interface EmailLog {
  id: number;
  certificate_id: number;
  recipient_email: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
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
  erro?: { message?: string; code?: string; response?: string };
  falhados_detalhe?: { nome: string; email: string; erro: string }[];
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
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulário de novo participante
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', phone: '', organization: '' });
  const [addError, setAddError] = useState('');

  // Autocomplete de participantes existentes
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; email: string; phone?: string; organization?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendResult, setResendResult] = useState<{ enrollmentId: number; success: boolean; message: string } | null>(null);

  // Logs de email
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [resendingLogId, setResendingLogId] = useState<number | null>(null);
  const [resendLogResult, setResendLogResult] = useState<{ id: number; success: boolean; message: string } | null>(null);

  // Emissão individual de certificado
  const [emittingCertId, setEmittingCertId] = useState<number | null>(null);
  const [certResults, setCertResults] = useState<Record<number, { success: boolean; message: string; code?: string }>>({});

  useEffect(() => {
    if (token && params.id) {
      loadEvent();
    }
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
      setSuggestions([]);
      setShowAddForm(false);
      loadEvent();
    } catch (err: any) {
      setAddError(err.message);
    }
  }

  function handleSearchChange(value: string) {
    setNewParticipant(p => ({ ...p, name: value }));
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await apiFetch(`/participants/search?q=${encodeURIComponent(value)}`, { token: token! });
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }

  function handleSelectSuggestion(p: { id: number; name: string; email: string; phone?: string; organization?: string }) {
    setNewParticipant({
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      organization: p.organization || '',
    });
    setSuggestions([]);
    setShowSuggestions(false);
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
        body: undefined,
      });
      setEmitResult(data);
    } catch (err: any) {
      setEmitError(err.message || 'Erro ao emitir badges/certificados');
    } finally {
      setEmitLoading(false);
    }
  }

  async function handleResendEmail(enrollmentId: number) {
    setResendingId(enrollmentId);
    setResendResult(null);
    try {
      await apiFetch(`/enrollments/${enrollmentId}/resend-email`, {
        method: 'POST',
        token: token!,
      });
      setResendResult({ enrollmentId, success: true, message: 'Email reenviado com sucesso' });
    } catch (err: any) {
      setResendResult({ enrollmentId, success: false, message: err.message || 'Erro ao reenviar email' });
    } finally {
      setResendingId(null);
    }
  }

  function friendlyEmailError(error: string | null): string {
    if (!error) return '';
    const e = error.toLowerCase();
    if (e.includes('invalid') && e.includes('email') || e.includes('recipient address rejected') || e.includes('user unknown') || e.includes('no such user'))
      return 'Endereco de email invalido ou inexistente';
    if (e.includes('econnrefused') || e.includes('enotfound') || e.includes('etimedout') || e.includes('network'))
      return 'Falha de ligacao — sem acesso ao servidor de email';
    if (e.includes('535') || e.includes('authentication') || e.includes('username and password') || e.includes('auth'))
      return 'Credenciais de email incorretas — verificar configuracao';
    if (e.includes('550') || e.includes('mailbox') && e.includes('full') || e.includes('quota'))
      return 'Caixa de correio do destinatario cheia';
    if (e.includes('421') || e.includes('too many') || e.includes('rate limit'))
      return 'Demasiados emails enviados — limite do servidor atingido';
    if (e.includes('starttls') || e.includes('ssl') || e.includes('tls'))
      return 'Erro de seguranca na ligacao ao servidor de email';
    if (e.includes('spam') || e.includes('blocked') || e.includes('blacklist'))
      return 'Email bloqueado pelo servidor de destino (possivel spam)';
    if (e.includes('certificate') || e.includes('pdf') || e.includes('badge') || e.includes('file'))
      return 'Erro ao anexar o certificado ou badge ao email';
    return 'Erro desconhecido ao enviar o email';
  }

  async function handleEmitCertificate(enrollmentId: number) {
    setEmittingCertId(enrollmentId);
    try {
      const data = await apiFetch('/certificates', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });
      setCertResults(prev => ({
        ...prev,
        [enrollmentId]: { success: true, message: 'Certificado emitido', code: data.validationCode },
      }));
    } catch (err: any) {
      const alreadyExists = err.message?.toLowerCase().includes('já emitido');
      setCertResults(prev => ({
        ...prev,
        [enrollmentId]: { success: false, message: alreadyExists ? 'Certificado ja emitido' : (err.message || 'Erro ao emitir') },
      }));
    } finally {
      setEmittingCertId(null);
    }
  }

  async function loadEmailLogs() {
    setLogsLoading(true);
    setLogsError('');
    try {
      const data = await apiFetch(`/events/${params.id}/email-logs`, { token: token! });
      setEmailLogs(data);
    } catch (err: any) {
      setLogsError(err.message || 'Erro ao carregar logs');
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleToggleLogs() {
    const next = !showLogs;
    setShowLogs(next);
    if (next && emailLogs.length === 0) {
      await loadEmailLogs();
    }
  }

  async function handleResendLog(logId: number) {
    setResendingLogId(logId);
    setResendLogResult(null);
    try {
      await apiFetch(`/email-logs/${logId}/resend`, { method: 'PATCH', token: token! });
      setResendLogResult({ id: logId, success: true, message: 'Email reenviado com sucesso' });
      await loadEmailLogs();
    } catch (err: any) {
      setResendLogResult({ id: logId, success: false, message: err.message || 'Erro ao reenviar email' });
    } finally {
      setResendingLogId(null);
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
        {isAdmin && (
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Editar
          </Link>
        )}
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
      {isAdmin && event.enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Emissão de certificados</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {eligibleCount > 0
                  ? `${eligibleCount} participante${eligibleCount !== 1 ? 's' : ''} ${eligibleCount !== 1 ? 'elegíveis' : 'elegível'} para emissão`
                  : event.type === 'evento'
                    ? 'Nenhum participante com presença confirmada'
                    : 'Nenhum participante aprovado'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
                  <> Emitir badges</>
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
                  <> Enviar emails</>
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
              {emailResult.falhados_detalhe && emailResult.falhados_detalhe.length > 0 && (
                <div className="mt-2 space-y-1">
                  {emailResult.falhados_detalhe.map((f, i) => (
                    <div key={i} className="text-xs bg-yellow-100 rounded px-2 py-1.5">
                      <span className="font-semibold">{f.nome}</span> — {f.email}
                      <span className="block opacity-70 mt-0.5">Erro: {f.erro}</span>
                    </div>
                  ))}
                </div>
              )}
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
            {isAdmin && (
              <>
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
                  {importing ? 'A importar...' : ' Importar CSV'}
                </button>
              </>
            )}
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
              <div className="relative">
                <input
                  placeholder="Nome * (ou pesquisar existente)"
                  value={newParticipant.name}
                  onChange={e => handleSearchChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                      <li
                        key={s.id}
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                      >
                        <span className="font-medium text-gray-900">{s.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{s.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3">
                        {isAdmin && (event.type === 'evento' ? enrollment.status === 'presente' : enrollment.evaluation_result === 'aprovado') && (
                          <button
                            onClick={() => handleEmitCertificate(enrollment.id)}
                            disabled={emittingCertId === enrollment.id}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-40"
                            title="Emitir certificado individual"
                          >
                            {emittingCertId === enrollment.id ? 'A emitir...' : 'Emitir certificado'}
                          </button>
                        )}
                        <button
                          onClick={() => handleResendEmail(enrollment.id)}
                          disabled={resendingId === enrollment.id}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40"
                          title="Reenviar email do certificado"
                        >
                          {resendingId === enrollment.id ? 'A enviar...' : 'Reenviar email'}
                        </button>
                        {resendResult?.enrollmentId === enrollment.id && (
                          <span className={`text-xs font-medium ${resendResult.success ? 'text-green-600' : 'text-red-500'}`}>
                            {resendResult.success ? 'Enviado!' : 'Erro'}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveParticipant(enrollment.id, enrollment.participant.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remover
                        </button>
                      </div>
                      {certResults[enrollment.id] && (
                        <span className={`text-xs ${certResults[enrollment.id].success ? 'text-green-600' : 'text-amber-600'}`}>
                          {certResults[enrollment.id].message}
                          {certResults[enrollment.id].code && (
                            <span className="ml-1 font-mono text-gray-500">({certResults[enrollment.id].code})</span>
                          )}
                        </span>
                      )}
                    </div>
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

      {/* Email Logs Section */}
      {isAdmin && <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
        <button
          onClick={handleToggleLogs}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Logs de email</h2>
            <p className="text-xs text-gray-500 mt-0.5">Historico de envios de certificados por email</p>
          </div>
          <div className="flex items-center gap-2">
            {emailLogs.length > 0 && (
              <span className="text-xs text-gray-400">{emailLogs.length} registos</span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showLogs ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showLogs && (
          <div className="border-t border-gray-200">
            <div className="flex items-center justify-end px-6 py-3 bg-gray-50 border-b border-gray-100">
              <button
                onClick={loadEmailLogs}
                disabled={logsLoading}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40"
              >
                {logsLoading ? 'A carregar...' : 'Atualizar'}
              </button>
            </div>

            {resendLogResult && (
              <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm border ${
                resendLogResult.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {resendLogResult.message}
              </div>
            )}

            {logsError && (
              <div className="mx-6 my-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {logsError}
              </div>
            )}

            {!logsLoading && emailLogs.length === 0 && !logsError && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Nenhum email enviado para este evento ainda.
              </div>
            )}

            {emailLogs.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data de envio</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700">{log.recipient_email}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : log.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Falhado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-3 max-w-xs">
                        {log.error_message ? (
                          <div>
                            <p className="text-xs text-red-600 font-medium">{friendlyEmailError(log.error_message)}</p>
                            <details className="mt-0.5">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                                ver detalhe tecnico
                              </summary>
                              <p className="text-xs text-gray-400 mt-1 break-words whitespace-pre-wrap">{log.error_message}</p>
                            </details>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {log.status !== 'sent' && (
                          <button
                            onClick={() => handleResendLog(log.id)}
                            disabled={resendingLogId === log.id}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40"
                          >
                            {resendingLogId === log.id ? 'A enviar...' : 'Reenviar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}
