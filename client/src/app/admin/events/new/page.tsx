// client/src/app/admin/events/new/page.tsx
// Formulário de criação de evento/curso

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/services/api';

export default function CreateEventPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'evento',
    start_date: '',
    end_date: '',
    location: '',
    duration_hours: '',
    category: '',
    template_id: '',
  });

  useEffect(() => {
    if (!token) return;
    apiFetch('/templates', { token }).then(setTemplates).catch(() => {});
  }, [token]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
        end_date: form.end_date || null,
        template_id: form.template_id ? parseInt(form.template_id) : null,
      };

      await apiFetch('/events', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(payload),
      });

      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/events" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
          ← Voltar aos eventos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Criar Evento</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Título *
          </label>
          <input
            id="title"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            placeholder="Nome do evento ou curso"
          />
        </div>

        {/* Tipo */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo *
          </label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
          >
            <option value="evento">Evento (apenas presença)</option>
            <option value="curso">Curso (presença + avaliação)</option>
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
            placeholder="Descrição do evento"
          />
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1.5">
              Data de início *
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              value={form.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1.5">
              Data de fim
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Local + Duração */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
              Local
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="CESAE Digital - Sala 1"
            />
          </div>
          <div>
            <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700 mb-1.5">
              Duração (horas)
            </label>
            <input
              id="duration_hours"
              name="duration_hours"
              type="number"
              min="1"
              value={form.duration_hours}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              placeholder="8"
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
            Categoria
          </label>
          <input
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            placeholder="Tecnologia, Design, Marketing..."
          />
        </div>

        {/* Template de badge */}
        <div>
          <label htmlFor="template_id" className="block text-sm font-medium text-gray-700 mb-1.5">
            Template de badge
          </label>
          <select
            id="template_id"
            name="template_id"
            value={form.template_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="">Template padrão</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'A criar...' : 'Criar Evento'}
          </button>
          <Link
            href="/admin/events"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}