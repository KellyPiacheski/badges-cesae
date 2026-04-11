"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/api";

interface DesignConfig {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  lightTextColor: string;
  borderColor: string;
}

interface BadgeTemplate {
  id: number;
  name: string;
  type: "evento" | "curso" | null;
  is_default: boolean;
  design_config: DesignConfig | null;
  created_at: string;
}

const DEFAULT_CONFIG: DesignConfig = {
  backgroundColor: "#FFFFFF",
  primaryColor: "#1B4F72",
  secondaryColor: "#2E86C1",
  accentColor: "#27AE60",
  textColor: "#1C2833",
  lightTextColor: "#566573",
  borderColor: "#D4E6F1",
};

const COLOR_LABELS: Record<keyof DesignConfig, string> = {
  backgroundColor: "Fundo",
  primaryColor: "Primária",
  secondaryColor: "Secundária",
  accentColor: "Destaque",
  textColor: "Texto",
  lightTextColor: "Texto claro",
  borderColor: "Borda",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function emptyForm() {
  return {
    name: "",
    type: "" as "evento" | "curso" | "",
    is_default: false,
    design_config: { ...DEFAULT_CONFIG },
  };
}

export default function TemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BadgeTemplate | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewTpl, setPreviewTpl] = useState<BadgeTemplate | null>(null);

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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setSaveError("");
    setShowForm(true);
  }

  function openEdit(tpl: BadgeTemplate) {
    setEditing(tpl);
    setForm({
      name: tpl.name,
      type: tpl.type || "",
      is_default: tpl.is_default,
      design_config: tpl.design_config ? { ...DEFAULT_CONFIG, ...tpl.design_config } : { ...DEFAULT_CONFIG },
    });
    setSaveError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function setColor(key: keyof DesignConfig, value: string) {
    setForm((f) => ({ ...f, design_config: { ...f.design_config, [key]: value } }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const body = {
        name: form.name.trim(),
        type: form.type || null,
        is_default: form.is_default,
        design_config: form.design_config,
      };
      if (editing) {
        await apiFetch(`/templates/${editing.id}`, { method: "PUT", body: JSON.stringify(body), token: token! });
      } else {
        await apiFetch("/templates", { method: "POST", body: JSON.stringify(body), token: token! });
      }
      await loadTemplates();
      closeForm();
    } catch (err: any) {
      setSaveError(err.message || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`/templates/${id}`, { method: "DELETE", token: token! });
      setDeleteId(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Badges</h1>
          <p className="text-gray-500 text-sm mt-1">Gere os templates de cores para geração de badges</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Novo template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Nenhum template criado ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{tpl.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(tpl.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {tpl.type && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tpl.type === "curso" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {tpl.type}
                    </span>
                  )}
                  {tpl.is_default && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      padrão
                    </span>
                  )}
                </div>
              </div>

              {/* Preview de cores */}
              {tpl.design_config && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(COLOR_LABELS) as (keyof DesignConfig)[]).map((key) =>
                    tpl.design_config![key] ? (
                      <span
                        key={key}
                        title={COLOR_LABELS[key]}
                        className="w-5 h-5 rounded-full border border-gray-200 inline-block"
                        style={{ backgroundColor: tpl.design_config![key] }}
                      />
                    ) : null
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={() => setPreviewTpl(tpl)}
                  className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => openEdit(tpl)}
                  className="flex-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteId(tpl.id)}
                  className="flex-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Editar template" : "Novo template"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{saveError}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="Ex: Template Azul"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 bg-white"
                >
                  <option value="">Qualquer tipo</option>
                  <option value="evento">Evento</option>
                  <option value="curso">Curso</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="w-4 h-4 accent-blue-900"
                />
                <label htmlFor="is_default" className="text-sm font-semibold text-gray-700">
                  Definir como template padrão
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Cores</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(COLOR_LABELS) as (keyof DesignConfig)[]).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.design_config[key]}
                        onChange={(e) => setColor(key, e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                      />
                      <span className="text-xs text-gray-600">{COLOR_LABELS[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                <div
                  className="rounded-xl border p-4 flex flex-col items-center gap-2"
                  style={{ backgroundColor: form.design_config.backgroundColor, borderColor: form.design_config.borderColor }}
                >
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: form.design_config.accentColor }} />
                  <p className="text-xs font-bold" style={{ color: form.design_config.primaryColor }}>CESAE DIGITAL</p>
                  <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center" style={{ borderColor: form.design_config.secondaryColor, backgroundColor: form.design_config.primaryColor }}>
                    <span className="text-white text-xs font-bold">CD</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: form.design_config.textColor }}>Nome do Participante</p>
                  <p className="text-xs" style={{ color: form.design_config.lightTextColor }}>Nome do Evento</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeForm}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preview */}
      {previewTpl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Preview — {previewTpl.name}</h2>
              <button onClick={() => setPreviewTpl(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              {(() => {
                const c = previewTpl.design_config ? { ...DEFAULT_CONFIG, ...previewTpl.design_config } : DEFAULT_CONFIG;
                return (
                  <div className="rounded-2xl border-4 p-6 flex flex-col items-center gap-3" style={{ backgroundColor: c.backgroundColor, borderColor: c.borderColor }}>
                    <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: c.accentColor }} />
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: c.primaryColor }}>CESAE DIGITAL</p>
                    <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center" style={{ borderColor: c.secondaryColor, backgroundColor: c.primaryColor }}>
                      <span className="text-white text-lg font-bold">CD</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold mt-1" style={{ color: c.textColor }}>Nome do Participante</p>
                      <p className="text-xs mt-0.5" style={{ color: c.lightTextColor }}>concluiu com sucesso</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: c.primaryColor }}>Nome do Evento</p>
                    </div>
                    <div className="w-full border-t mt-1 pt-3 flex justify-between text-xs" style={{ borderColor: c.borderColor, color: c.lightTextColor }}>
                      <span>01/01/2026</span>
                      <span style={{ color: c.accentColor }}>CERT-XXXX-XXXX</span>
                    </div>
                    <div className="w-full h-2 rounded-full mt-1" style={{ backgroundColor: c.secondaryColor }} />
                  </div>
                );
              })()}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setPreviewTpl(null)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Eliminar template</h2>
            <p className="text-sm text-gray-500 mb-6">Tens a certeza que queres eliminar este template? Esta ação não pode ser revertida.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
