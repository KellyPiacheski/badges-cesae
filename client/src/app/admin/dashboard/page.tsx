// client/src/app/admin/dashboard/page.tsx
// Página do dashboard (placeholder — Sprint 3)

'use client';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Visão geral da plataforma</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total de Eventos</p>
          <p className="text-3xl font-bold text-blue-900">—</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total de Participantes</p>
          <p className="text-3xl font-bold text-blue-900">—</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Badges Emitidos</p>
          <p className="text-3xl font-bold text-blue-900">—</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-400 text-center py-12">
          Estatísticas detalhadas serão implementadas no Sprint 3
        </p>
      </div>
    </div>
  );
}