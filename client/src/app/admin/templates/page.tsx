"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/api";

interface BadgeTemplate {
  id: number;
  name: string;
  type: "evento" | "curso" | null;
  is_default: boolean;
  design_config: Record<string, any> | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    loadTemplates();
  }, [token]);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/templates", { token: token! });
      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates de Badges</h1>
        <p className="text-gray-500 text-sm mt-1">
          Templates disponíveis para geração de badges
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Nenhum template criado ainda.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Padrão</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cores</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tpl.name}
                  </td>
                  <td className="px-4 py-3">
                    {tpl.type ? (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          tpl.type === "curso"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tpl.type}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tpl.is_default ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        padrão
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tpl.design_config ? (
                      <div className="flex items-center gap-1.5">
                        {["backgroundColor", "primaryColor", "accentColor"].map(
                          (key) =>
                            tpl.design_config![key] ? (
                              <span
                                key={key}
                                title={key}
                                className="w-4 h-4 rounded-full border border-gray-200 inline-block"
                                style={{
                                  backgroundColor: tpl.design_config![key],
                                }}
                              />
                            ) : null
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(tpl.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
