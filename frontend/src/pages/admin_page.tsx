import { useEffect, useMemo, useState } from "react";
import type { Role, User, Character } from "../api/types";
import {
  apiUsersCreate,
  apiUsersDelete,
  apiUsersList,
  apiUsersUpdate,
} from "../api/users_api";
import {
  apiCharacters,
  apiCharactersCreate,
  apiCharactersDelete,
  apiCharactersReset,
  apiCharactersUpdate,
  type CreateCharacterDto,
} from "../api/characters_api";

type Tab = "users" | "characters";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== USERS =====
  const [users, setUsers] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState("");

  const [cEmail, setCEmail] = useState("");
  const [cRole, setCRole] = useState<Role>("USER");
  const [cPasswordHash, setCPasswordHash] = useState("");

  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState<Role>("USER");
  const [ePasswordHash, setEPasswordHash] = useState("");

  // ===== CHARACTERS =====
  const [chars, setChars] = useState<Character[]>([]);
  const [charFilter, setCharFilter] = useState("");

  const [ccName, setCcName] = useState("");
  const [ccMaxHp, setCcMaxHp] = useState<number>(10);
  const [ccAttack, setCcAttack] = useState<number>(2);
  const [ccRequiredLevel, setCcRequiredLevel] = useState<number>(1);

  const [editCharId, setEditCharId] = useState<number | null>(null);
  const [ecName, setEcName] = useState("");
  const [ecMaxHp, setEcMaxHp] = useState<number>(10);
  const [ecAttack, setEcAttack] = useState<number>(2);
  const [ecRequiredLevel, setEcRequiredLevel] = useState<number>(1);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiUsersList();
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? "error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function loadChars() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCharacters();
      setChars(data);
    } catch (e: any) {
      setError(e?.message ?? "error cargando personajes");
    } finally {
      setLoading(false);
    }
  }

  async function reloadCurrent() {
    if (tab === "users") return loadUsers();
    return loadChars();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (tab === "characters" && chars.length === 0) {
      loadChars();
    }
  }, [tab]);

  const filteredUsers = useMemo(() => {
    const q = userFilter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        String(u.id).includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, userFilter]);

  const filteredChars = useMemo(() => {
    const q = charFilter.trim().toLowerCase();
    if (!q) return chars;
    return chars.filter((c) => {
      return (
        String(c.id).includes(q) ||
        c.name.toLowerCase().includes(q)
      );
    });
  }, [chars, charFilter]);

  // ===== USERS actions =====
  function startEditUser(u: User) {
    setEditUserId(u.id);
    setEEmail(u.email);
    setERole(u.role);
    setEPasswordHash("");
  }

  function cancelEditUser() {
    setEditUserId(null);
    setEEmail("");
    setERole("USER");
    setEPasswordHash("");
  }

  async function onCreateUser() {
    setError(null);
    const email = cEmail.trim().toLowerCase();
    if (!email) return setError("email obligatorio");
    if (!cPasswordHash.trim()) return setError("passwordHash obligatorio (segun tu backend)");

    setLoading(true);
    try {
      const created = await apiUsersCreate({
        email,
        role: cRole,
        passwordHash: cPasswordHash.trim(),
      });
      setUsers((prev) => [created, ...prev]);
      setCEmail("");
      setCRole("USER");
      setCPasswordHash("");
    } catch (e: any) {
      setError(e?.message ?? "error creando usuario");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveUser() {
    if (editUserId === null) return;

    setLoading(true);
    setError(null);
    try {
      const dto: any = {
        email: eEmail.trim().toLowerCase(),
        role: eRole,
      };
      if (ePasswordHash.trim()) dto.passwordHash = ePasswordHash.trim();

      const updated = await apiUsersUpdate(editUserId, dto);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      cancelEditUser();
    } catch (e: any) {
      setError(e?.message ?? "error guardando usuario");
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteUser(id: number) {
    const ok = confirm("borrar usuario?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await apiUsersDelete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (editUserId === id) cancelEditUser();
    } catch (e: any) {
      setError(e?.message ?? "error borrando usuario");
    } finally {
      setLoading(false);
    }
  }

  // ===== CHARACTERS actions =====
  function startEditChar(c: Character) {
    setEditCharId(c.id);
    setEcName(c.name);
    setEcMaxHp(c.maxHp);
    setEcAttack(c.attack);
    setEcRequiredLevel(c.requiredLevel);
  }

  function cancelEditChar() {
    setEditCharId(null);
    setEcName("");
    setEcMaxHp(10);
    setEcAttack(2);
    setEcRequiredLevel(1);
  }

  async function onCreateChar() {
    setError(null);

    const dto: CreateCharacterDto = {
      name: ccName.trim(),
      maxHp: Number(ccMaxHp),
      attack: Number(ccAttack),
      requiredLevel: Number(ccRequiredLevel),
    };

    if (!dto.name) return setError("name obligatorio");
    if (dto.maxHp < 1) return setError("maxHp minimo 1");
    if (dto.attack < 0) return setError("attack minimo 0");
    if (dto.requiredLevel < 1) return setError("requiredLevel minimo 1");

    setLoading(true);
    try {
      const created = await apiCharactersCreate(dto);
      setChars((prev) => [created, ...prev]);
      setCcName("");
      setCcMaxHp(10);
      setCcAttack(2);
      setCcRequiredLevel(1);
    } catch (e: any) {
      setError(e?.message ?? "error creando personaje");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveChar() {
    if (editCharId === null) return;

    setLoading(true);
    setError(null);
    try {
      const dto = {
        name: ecName.trim(),
        maxHp: Number(ecMaxHp),
        attack: Number(ecAttack),
        requiredLevel: Number(ecRequiredLevel),
      };

      const updated = await apiCharactersUpdate(editCharId, dto);
      setChars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      cancelEditChar();
    } catch (e: any) {
      setError(e?.message ?? "error guardando personaje");
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteChar(id: number) {
    const ok = confirm("borrar personaje?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await apiCharactersDelete(id);
      setChars((prev) => prev.filter((c) => c.id !== id));
      if (editCharId === id) cancelEditChar();
    } catch (e: any) {
      setError(e?.message ?? "error borrando personaje");
    } finally {
      setLoading(false);
    }
  }

  async function onResetHp() {
    const ok = confirm("resetear hp de todos los personajes?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await apiCharactersReset();
      await loadChars();
    } catch (e: any) {
      setError(e?.message ?? "error reseteando hp");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-semibold">panel admin</div>
            <div className="text-sm text-zinc-400">usuarios y personajes</div>
          </div>

          <div className="flex gap-2">
            <button
              className={`rounded-xl px-3 py-2 text-sm border ${
                tab === "users"
                  ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                  : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => setTab("users")}
            >
              usuarios
            </button>
            <button
              className={`rounded-xl px-3 py-2 text-sm border ${
                tab === "characters"
                  ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                  : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => setTab("characters")}
            >
              personajes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
            onClick={reloadCurrent}
          >
            recargar
          </button>

          {tab === "users" ? (
            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500 min-w-[320px]"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="filtrar por id/email/role"
            />
          ) : (
            <div className="flex gap-3 flex-wrap items-center">
              <input
                className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500 min-w-[320px]"
                value={charFilter}
                onChange={(e) => setCharFilter(e.target.value)}
                placeholder="filtrar por id/nombre"
              />
              <button
                className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
                onClick={onResetHp}
              >
                reset hp
              </button>
            </div>
          )}
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? <div className="mb-4 text-xs text-zinc-500">cargando...</div> : null}

        {tab === "users" ? (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 mb-4">
              <div className="text-lg font-semibold mb-3">crear usuario</div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  placeholder="email"
                />
                <select
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  value={cRole}
                  onChange={(e) => setCRole(e.target.value as Role)}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  value={cPasswordHash}
                  onChange={(e) => setCPasswordHash(e.target.value)}
                  placeholder="passwordHash (obligatorio)"
                />
                <button
                  className="rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 font-medium"
                  onClick={onCreateUser}
                >
                  crear
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                nota: tu backend pide passwordHash en CreateUserDto. Si quieres crear con password normal, hay que anadir un endpoint que lo hashee en backend.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-zinc-950 text-zinc-300">
                    <tr className="border-b border-zinc-800">
                      <th className="py-2 px-3 text-left font-semibold">id</th>
                      <th className="py-2 px-3 text-left font-semibold">email</th>
                      <th className="py-2 px-3 text-left font-semibold">role</th>
                      <th className="py-2 px-3 text-left font-semibold">lvl</th>
                      <th className="py-2 px-3 text-left font-semibold">xp</th>
                      <th className="py-2 px-3 text-left font-semibold">wins</th>
                      <th className="py-2 px-3 text-left font-semibold">losses</th>
                      <th className="py-2 px-3 text-left font-semibold">acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                        <td className="py-2 px-3">{u.id}</td>
                        <td className="py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3">{u.role}</td>
                        <td className="py-2 px-3">{u.level}</td>
                        <td className="py-2 px-3">{u.xp}</td>
                        <td className="py-2 px-3">{u.wins}</td>
                        <td className="py-2 px-3">{u.losses}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-3">
                            <button className="underline" onClick={() => startEditUser(u)}>
                              editar
                            </button>
                            <button className="underline" onClick={() => onDeleteUser(u.id)}>
                              borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!filteredUsers.length ? (
                      <tr>
                        <td className="py-3 px-3 text-zinc-500" colSpan={8}>
                          sin usuarios
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {editUserId !== null ? (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="text-lg font-semibold mb-3">editar usuario #{editUserId}</div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    value={eEmail}
                    onChange={(e) => setEEmail(e.target.value)}
                    placeholder="email"
                  />
                  <select
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    value={eRole}
                    onChange={(e) => setERole(e.target.value as Role)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    value={ePasswordHash}
                    onChange={(e) => setEPasswordHash(e.target.value)}
                    placeholder="passwordHash (solo si quieres cambiarla)"
                  />

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 font-medium"
                      onClick={onSaveUser}
                    >
                      guardar
                    </button>
                    <button
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
                      onClick={cancelEditUser}
                    >
                      cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 mb-4">
              <div className="text-lg font-semibold mb-3">crear personaje</div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  value={ccName}
                  onChange={(e) => setCcName(e.target.value)}
                  placeholder="name"
                />
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  type="number"
                  value={ccMaxHp}
                  onChange={(e) => setCcMaxHp(Number(e.target.value))}
                  placeholder="maxHp"
                />
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  type="number"
                  value={ccAttack}
                  onChange={(e) => setCcAttack(Number(e.target.value))}
                  placeholder="attack"
                />
                <input
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                  type="number"
                  value={ccRequiredLevel}
                  onChange={(e) => setCcRequiredLevel(Number(e.target.value))}
                  placeholder="requiredLevel"
                />
                <button
                  className="rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 font-medium"
                  onClick={onCreateChar}
                >
                  crear
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                nota: al crear, el backend pone hp = maxHp automaticamente.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-zinc-950 text-zinc-300">
                    <tr className="border-b border-zinc-800">
                      <th className="py-2 px-3 text-left font-semibold">id</th>
                      <th className="py-2 px-3 text-left font-semibold">name</th>
                      <th className="py-2 px-3 text-left font-semibold">hp</th>
                      <th className="py-2 px-3 text-left font-semibold">maxHp</th>
                      <th className="py-2 px-3 text-left font-semibold">attack</th>
                      <th className="py-2 px-3 text-left font-semibold">requiredLevel</th>
                      <th className="py-2 px-3 text-left font-semibold">acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredChars.map((c) => (
                      <tr key={c.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                        <td className="py-2 px-3">{c.id}</td>
                        <td className="py-2 px-3">{c.name}</td>
                        <td className="py-2 px-3">{c.hp}</td>
                        <td className="py-2 px-3">{c.maxHp}</td>
                        <td className="py-2 px-3">{c.attack}</td>
                        <td className="py-2 px-3">{c.requiredLevel}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-3">
                            <button className="underline" onClick={() => startEditChar(c)}>
                              editar
                            </button>
                            <button className="underline" onClick={() => onDeleteChar(c.id)}>
                              borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!filteredChars.length ? (
                      <tr>
                        <td className="py-3 px-3 text-zinc-500" colSpan={7}>
                          sin personajes
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {editCharId !== null ? (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="text-lg font-semibold mb-3">editar personaje #{editCharId}</div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    value={ecName}
                    onChange={(e) => setEcName(e.target.value)}
                    placeholder="name"
                  />
                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    type="number"
                    value={ecMaxHp}
                    onChange={(e) => setEcMaxHp(Number(e.target.value))}
                    placeholder="maxHp"
                  />
                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    type="number"
                    value={ecAttack}
                    onChange={(e) => setEcAttack(Number(e.target.value))}
                    placeholder="attack"
                  />
                  <input
                    className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                    type="number"
                    value={ecRequiredLevel}
                    onChange={(e) => setEcRequiredLevel(Number(e.target.value))}
                    placeholder="requiredLevel"
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 font-medium"
                      onClick={onSaveChar}
                    >
                      guardar
                    </button>
                    <button
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
                      onClick={cancelEditChar}
                    >
                      cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}