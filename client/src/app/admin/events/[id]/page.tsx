// client/src/app/admin/events/[id]/page.tsx
// Detalhe do evento — info + participantes + presenças + avaliações

'use client';

import { useState, useEffect } from 'react';
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

      {/* Participants Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Participantes ({event.enrollments.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Adicionar
          </button>
        </div>

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