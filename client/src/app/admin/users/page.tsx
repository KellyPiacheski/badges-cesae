"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/api";
import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ParticipantItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCurrentUserId(token: string): number | null {
  try {
    return JSON.parse(atob(token.split(".")[1])).id ?? null;
  } catch {
    return null;
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"formadores" | "formandos">(
    "formadores"
  );

  // Formadores
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  // Formandos
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState("");

  // User modal
  const [userModal, setUserModal] = useState<{
    open: boolean;
    editing: UserItem | null;
  }>({ open: false, editing: null });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [userSaving, setUserSaving] = useState(false);
  const [userFormError, setUserFormError] = useState("");

  // Participant modal
  const [participantModal, setParticipantModal] = useState<{
    open: boolean;
    editing: ParticipantItem | null;
  }>({ open: false, editing: null });
  const [participantForm, setParticipantForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });
  const [participantSaving, setParticipantSaving] = useState(false);
  const [participantFormError, setParticipantFormError] = useState("");

  // Import
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = token ? getCurrentUserId(token) : null;

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    loadUsers();
    loadParticipants();
  }, [token]);

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setUsersError("");
      const data = await apiFetch("/users", { token: token! });
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadParticipants() {
    try {
      setParticipantsLoading(true);
      setParticipantsError("");
      const data = await apiFetch("/participants", { token: token! });
      setParticipants(data);
    } catch (err: any) {
      setParticipantsError(err.message);
    } finally {
      setParticipantsLoading(false);
    }
  }

  // ── User CRUD ───────────────────────────────────────────────────────────────

  function openCreateUser() {
    setUserForm({ name: "", email: "", password: "" });
    setUserFormError("");
    setUserModal({ open: true, editing: null });
  }

  function openEditUser(user: UserItem) {
    setUserForm({ name: user.name, email: user.email, password: "" });
    setUserFormError("");
    setUserModal({ open: true, editing: user });
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      setUserFormError("Nome e email são obrigatórios.");
      return;
    }
    if (!userModal.editing && !userForm.password) {
      setUserFormError("Password é obrigatória para criar formador.");
      return;
    }

    setUserSaving(true);
    setUserFormError("");
    try {
      const body: any = { name: userForm.name, email: userForm.email };
      if (userForm.password) body.password = userForm.password;

      if (userModal.editing) {
        const updated = await apiFetch(`/users/${userModal.editing.id}`, {
          method: "PUT",
          token: token!,
          body: JSON.stringify(body),
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
      } else {
        const created = await apiFetch("/users", {
          method: "POST",
          token: token!,
          body: JSON.stringify(body),
        });
        setUsers((prev) => [created, ...prev]);
      }
      setUserModal({ open: false, editing: null });
    } catch (err: any) {
      setUserFormError(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function handleDeleteUser(user: UserItem) {
    if (
      !confirm(
        `Remover formador "${user.name}"? Esta ação não pode ser revertida.`
      )
    )
      return;
    try {
      await apiFetch(`/users/${user.id}`, { method: "DELETE", token: token! });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  // ── Participant CRUD ────────────────────────────────────────────────────────

  function openCreateParticipant() {
    setParticipantForm({ name: "", email: "", phone: "", organization: "" });
    setParticipantFormError("");
    setParticipantModal({ open: true, editing: null });
  }

  function openEditParticipant(p: ParticipantItem) {
    setParticipantForm({
      name: p.name,
      email: p.email,
      phone: p.phone || "",
      organization: p.organization || "",
    });
    setParticipantFormError("");
    setParticipantModal({ open: true, editing: p });
  }

  async function handleSaveParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!participantForm.name || !participantForm.email) {
      setParticipantFormError("Nome e email são obrigatórios.");
      return;
    }

    setParticipantSaving(true);
    setParticipantFormError("");
    try {
      const body = {
        name: participantForm.name,
        email: participantForm.email,
        phone: participantForm.phone || null,
        organization: participantForm.organization || null,
      };

      if (participantModal.editing) {
        const updated = await apiFetch(
          `/participants/${participantModal.editing.id}`,
          { method: "PUT", token: token!, body: JSON.stringify(body) }
        );
        setParticipants((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const created = await apiFetch("/participants", {
          method: "POST",
          token: token!,
          body: JSON.stringify(body),
        });
        setParticipants((prev) => [created, ...prev]);
      }
      setParticipantModal({ open: false, editing: null });
    } catch (err: any) {
      setParticipantFormError(err.message);
    } finally {
      setParticipantSaving(false);
    }
  }

  async function handleDeleteParticipant(p: ParticipantItem) {
    if (
      !confirm(
        `Remover formando "${p.name}"? Esta ação não pode ser revertida.`
      )
    )
      return;
    try {
      await apiFetch(`/participants/${p.id}`, {
        method: "DELETE",
        token: token!,
      });
      setParticipants((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as any[];

      const toImport = rows
        .map((row) => ({
          name: row.nome || row.name || row.Nome || "",
          email: row.email || row.Email || "",
          phone: row.telefone || row.phone || row.Telefone || null,
          organization:
            row.organizacao ||
            row.organization ||
            row["Organização"] ||
            row.Organizacao ||
            null,
        }))
        .filter((p) => p.name && p.email);

      if (toImport.length === 0) {
        alert(
          "Nenhum formando válido encontrado. Verifica se o ficheiro tem as colunas: nome, email, telefone, organizacao."
        );
        return;
      }

      const result = await apiFetch("/participants/import", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ participants: toImport }),
      });

      alert(result.message);
      loadParticipants();
    } catch (err: any) {
      alert("Erro na importação: " + err.message);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function downloadSampleFile() {
    const sampleData = [
      {
        nome: "Maria Silva",
        email: "maria.silva@exemplo.pt",
        telefone: "912345678",
        organizacao: "CESAE Digital",
      },
      {
        nome: "João Santos",
        email: "joao.santos@exemplo.pt",
        telefone: "923456789",
        organizacao: "Empresa XYZ",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formandos");
    XLSX.writeFile(wb, "formandos-exemplo.xlsx");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestão de formadores e formandos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(["formadores", "formandos"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-blue-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "formadores" ? "Formadores" : "Formandos"}
          </button>
        ))}
      </div>

      {/* ── TAB: FORMADORES ── */}
      {activeTab === "formadores" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {users.length} formador{users.length !== 1 ? "es" : ""}
            </p>
            <button
              onClick={openCreateUser}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              + Adicionar Formador
            </button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usersError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {usersError}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              Nenhum formador criado ainda.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Criado em
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            eu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEditUser(user)}
                            className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                          >
                            Editar
                          </button>
                          {user.id !== currentUserId && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FORMANDOS ── */}
      {activeTab === "formandos" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-500">
              {participants.length} formando
              {participants.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadSampleFile}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Descarregar ficheiro de exemplo
              </button>

              <label
                className={`px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer ${
                  importLoading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {importLoading ? "A importar…" : "Importar CSV/XLSX"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>

              <button
                onClick={openCreateParticipant}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                + Adicionar Formando
              </button>
            </div>
          </div>

          {participantsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : participantsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {participantsError}
            </div>
          ) : participants.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              Nenhum formando registado ainda.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Telefone
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Organização
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.email}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.organization || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEditParticipant(p)}
                            className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: FORMADOR ── */}
      {userModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {userModal.editing ? "Editar Formador" : "Adicionar Formador"}
              </h2>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {userFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {userFormError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="email@exemplo.pt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password{" "}
                  {userModal.editing ? (
                    <span className="text-gray-400 font-normal">
                      (deixar em branco para não alterar)
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setUserModal({ open: false, editing: null })
                  }
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
                >
                  {userSaving ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: FORMANDO ── */}
      {participantModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {participantModal.editing
                  ? "Editar Formando"
                  : "Adicionar Formando"}
              </h2>
            </div>
            <form onSubmit={handleSaveParticipant} className="p-6 space-y-4">
              {participantFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {participantFormError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={participantForm.name}
                  onChange={(e) =>
                    setParticipantForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={participantForm.email}
                  onChange={(e) =>
                    setParticipantForm((f) => ({
                      ...f,
                      email: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="email@exemplo.pt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={participantForm.phone}
                  onChange={(e) =>
                    setParticipantForm((f) => ({
                      ...f,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="9XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organização{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={participantForm.organization}
                  onChange={(e) =>
                    setParticipantForm((f) => ({
                      ...f,
                      organization: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Empresa ou instituição"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setParticipantModal({ open: false, editing: null })
                  }
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={participantSaving}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
                >
                  {participantSaving ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
