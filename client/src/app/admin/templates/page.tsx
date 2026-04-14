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
  globeColor: string;
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
  accentColor: "#7B2FBE",
  textColor: "#1C2833",
  lightTextColor: "#566573",
  borderColor: "#D4E6F1",
  globeColor: "#A569BD",
};

const COLOR_LABELS: Record<keyof DesignConfig, string> = {
  backgroundColor: "Fundo",
  primaryColor: "Primária",
  secondaryColor: "Secundária",
  accentColor: "Destaque (fundo badge)",
  textColor: "Texto",
  lightTextColor: "Texto claro",
  borderColor: "Borda",
  globeColor: "Linha do globo",
};

function BadgePreview({ config, eventTitle = "Nome do Evento" }: { config: DesignConfig; eventTitle?: string }) {
  const bg = config.accentColor || "#7B2FBE";
  const lineColor = config.secondaryColor || "#9B59B6";
  const globeColor = config.globeColor || "#A569BD";

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: bg, aspectRatio: "1/1", width: "100%" }}
    >
      {/* Topo: logo CESAE + verificado */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <img src="/cesae-logo.svg" alt="CESAE Digital" className="h-7 brightness-0 invert" />
        <span className="text-white font-bold text-sm">Verificado</span>
      </div>

      {/* Linha separadora */}
      <div className="w-full h-px" style={{ backgroundColor: lineColor }} />

      {/* Globo centrado */}
      <div className="flex-1 flex items-center justify-center py-3">
        <svg viewBox="0 0 100 100" className="w-2/3 h-2/3" fill="none" stroke={globeColor} strokeWidth="3">
          <circle cx="50" cy="50" r="38" />
          <ellipse cx="50" cy="50" rx="20" ry="38" />
          <line x1="12" y1="50" x2="88" y2="50" />
          <path d="M17 30 Q50 40 83 30" />
          <path d="M17 70 Q50 60 83 70" />
        </svg>
      </div>

      {/* Título do evento */}
      <div className="px-4 pb-4 text-center">
        <p className="text-white font-bold text-sm leading-tight">{eventTitle}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-PT", {
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
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
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
        {isAdmin && (
          <button
            onClick={openCreate}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Novo template
          </button>
        )}
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
                {isAdmin && (
                  <>
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
                  </>
                )}
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
                <div className="w-48 mx-auto">
                  <BadgePreview config={form.design_config} eventTitle={form.name || "Nome do Evento"} />
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
              <div className="w-56 mx-auto">
                <BadgePreview
                  config={previewTpl.design_config ? { ...DEFAULT_CONFIG, ...previewTpl.design_config } : DEFAULT_CONFIG}
                  eventTitle={previewTpl.name}
                />
              </div>
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
