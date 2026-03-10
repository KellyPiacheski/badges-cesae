// client/src/app/admin/events/page.tsx
// Lista de eventos — tabela com filtros e botão criar

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/services/api';

interface EventItem {
  id: number;
  title: string;
  type: 'evento' | 'curso';
  start_date: string;
  end_date: string | null;
  location: string | null;
  category: string | null;
  participant_count: number;
  creator: { id: number; name: string } | null;
}

export default function EventsListPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (!token) return;
    loadEvents();
  }, [token, filterType]);

  async function loadEvents() {
    try {
      setLoading(true);
      const query = filterType ? `?type=${filterType}` : '';
      const data = await apiFetch(`/events${query}`, { token: token! });
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Eliminar "${title}"? Esta ação não pode ser revertida.`)) return;

    try {
      await apiFetch(`/events/${id}`, { method: 'DELETE', token: token! });
      setEvents(events.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de eventos e cursos</p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-blue-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + Criar Evento
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Filtrar por tipo:</span>
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === '' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('evento')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'evento' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setFilterType('curso')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'curso' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cursos
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">A carregar...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Nenhum evento encontrado.
            <Link href="/admin/events/new" className="text-blue-600 hover:underline ml-1">
              Criar o primeiro?
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Evento</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Local</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Participantes</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/events/${event.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {event.title}
                    </Link>
                    {event.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{event.category}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      event.type === 'evento'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type === 'evento' ? 'Evento' : 'Curso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date && (
                      <span className="text-gray-400"> — {formatDate(event.end_date)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {event.location || '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {event.participant_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}