// client/src/app/admin/dashboard/page.tsx
// Dashboard com estatísticas reais da plataforma

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/services/api';

interface DashboardStats {
  totais: {
    eventos: number;
    cursos: number;
    participantes: number;
    badges: number;
    certificados: number;
    emailsEnviados: number;
    emailsFalhados: number;
  };
  taxas: {
    presenca: number;
    aprovacao: number;
  };
  porMes: { mes: string; eventos: number; badges: number }[];
}

type ExportFormat = 'xlsx' | 'pdf';

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-900',
    purple: 'text-purple-700',
    green: 'text-green-700',
    red: 'text-red-600',
    gray: 'text-gray-700',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[accent ?? 'blue']}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}%</p>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiFetch('/stats/dashboard', { token })
      .then(setStats)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleExport(format: ExportFormat) {
    if (!token) return;
    setExportLoading(format);
    setExportError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/stats/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `Erro ${response.status}` }));
        throw new Error(err.error || `Erro ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-cesae-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Erro ao exportar relatório');
    } finally {
      setExportLoading(null);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-8">Visão geral da plataforma</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
          Erro ao carregar estatísticas: {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { totais, taxas, porMes } = stats;

  return (
    <div>
      {/* Header com botões de exportação */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500">Visão geral da plataforma</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exportLoading !== null}
              className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading === 'xlsx' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              )}
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportLoading !== null}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading === 'pdf' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              )}
              PDF
            </button>
          </div>
        )}
      </div>

      {exportError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
          {exportError}
        </div>
      )}

      {/* Linha 1 — Totais principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Eventos realizados"
          value={totais.eventos}
          sub={`+ ${totais.cursos} curso${totais.cursos !== 1 ? 's' : ''}`}
          accent="blue"
        />
        <StatCard
          label="Participantes únicos"
          value={totais.participantes}
          accent="purple"
        />
        <StatCard
          label="Badges emitidos"
          value={totais.badges}
          accent="green"
        />
        <StatCard
          label="Certificados emitidos"
          value={totais.certificados}
          accent="blue"
        />
      </div>

      {/* Linha 2 — Taxas + Emails */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <RateCard label="Taxa de presença" value={taxas.presenca} />
        <RateCard label="Taxa de aprovação" value={taxas.aprovacao} />
        <StatCard
          label="Emails enviados"
          value={totais.emailsEnviados}
          accent="green"
        />
        <StatCard
          label="Emails falhados"
          value={totais.emailsFalhados}
          accent={totais.emailsFalhados > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Gráfico — Atividade mensal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Atividade nos últimos 6 meses
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Eventos/cursos realizados e badges emitidos por mês
        </p>

        {mounted ? (
          porMes.every((m) => m.eventos === 0 && m.badges === 0) ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              Sem dados nos últimos 6 meses
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porMes} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  formatter={(value) =>
                    value === 'eventos' ? 'Eventos/Cursos' : 'Badges'
                  }
                />
                <Bar dataKey="eventos" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="badges" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
        )}
      </div>
    </div>
  );
}
