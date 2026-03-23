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
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

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
  const totalEventosCursos = totais.eventos + totais.cursos;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Visão geral da plataforma</p>

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
          porMes.every(m => m.eventos === 0 && m.badges === 0) ? (
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
