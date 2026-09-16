import { useEffect, useState } from "react"

import { useSearchParams } from "react-router-dom"

import { useStore, canAccess } from "../store"

import type { AppRole, AppUser, Permission, UserRole } from "../store"

type UserSection = "permissions" | "roles" | "list"

const ROLE_LABELS: Record<string, string> = {
  "super-administrativo": "SUPER ADMINISTRATIVO",

  supervisor: "Supervisor",

  operador: "Operador",
}

export default function UsuariosPage() {
  const {
    currentUser,
    users,
    setUsers,
    roles,
    setRoles,
    availablePermissions,
  } = useStore()

  const [searchParams] = useSearchParams()

  const [section, setSection] = useState<UserSection>("list")

  const [selectedId, setSelectedId] = useState(
    users.find((user) => user.username === currentUser)?.id ?? "",
  )

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "operador" as UserRole,
  })

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const [roleForm, setRoleForm] = useState({
    key: "",
    label: "",
    permissions: [] as Permission[],
  })

  const [message, setMessage] = useState("")

  const [error, setError] = useState("")

  const canManage = canAccess(currentUser, users, "users.menu")
  const canCreateUser = canManage
  const canEditUser = canManage
  const canManageRoles = canManage

  const selectedUser = users.find((user) => user.id === selectedId)

  const roleLabel = (roleKey: string) =>
    roles.find((role) => role.key === roleKey)?.label ?? ROLE_LABELS[roleKey] ?? roleKey

  useEffect(() => {
    const requested = searchParams.get("section") as UserSection | null

    if (requested) setSection(requested)
  }, [searchParams])

  function resetForm() {
    setForm({ username: "", password: "", role: "operador" })

    setSelectedId("")

    setError("")
  }

  function resetRoleForm() {
    setRoleForm({ key: "", label: "", permissions: [] })

    setError("")
  }

  function saveRole() {
    if (!canManageRoles) return
    const key = roleForm.key.trim().toLowerCase().replace(/\s+/g, "-")

    const label = roleForm.label.trim()

    if (!key || !label) {
      setError("Clave y nombre del rol son obligatorios.")
      return
    }

    if (roles.some((role) => role.key === key && role.id !== selectedRoleId)) {
      setError("La clave de rol ya existe.")
      return
    }

    const nextRole: AppRole = {
      id: selectedRoleId ?? Date.now().toString(),
      key,
      label,
      permissions: roleForm.permissions,
    }

    setRoles((previous) =>
      selectedRoleId
        ? previous.map((role) => (role.id === selectedRoleId ? nextRole : role))
        : [...previous, nextRole],
    )

    if (selectedRoleId) {
      const previousRole = roles.find((role) => role.id === selectedRoleId)

      setUsers((previous) =>
        previous.map((user) =>
          user.role === previousRole?.key
            ? { ...user, role: key, permissions: roleForm.permissions }
            : user,
        ),
      )

      setMessage("Rol actualizado.")
    } else {
      setMessage("Rol creado.")
    }

    resetRoleForm()
  }

  function editRole(role: AppRole) {
    if (!canManageRoles) return
    setSelectedRoleId(role.id)

    setRoleForm({
      key: role.key,
      label: role.label,
      permissions: role.permissions,
    })

    setError("")
  }

  function removeRole(role: AppRole) {
    if (!canManageRoles) return
    if (role.system) {
      setError("Los roles del sistema no se pueden eliminar.")
      return
    }

    if (users.some((user) => user.role === role.key)) {
      setError("No puedes eliminar un rol asignado a usuarios.")
      return
    }

    setRoles((previous) => previous.filter((item) => item.id !== role.id))

    if (selectedRoleId === role.id) resetRoleForm()

    setMessage("Rol eliminado.")
  }

  function toggleRolePermission(permission: Permission) {
    if (!canManageRoles) return
    setRoleForm((previous) => ({
      ...previous,
      permissions: previous.permissions.includes(permission)
        ? previous.permissions.filter((value) => value !== permission)
        : [...previous.permissions, permission],
    }))
  }

  function saveUser() {
    if (selectedId ? !canEditUser : !canCreateUser) return

    const username = form.username.trim().toLowerCase()

    if (!username || !form.password) {
      setError("Usuario y contraseña son obligatorios.")
      return
    }

    if (
      users.some((user) => user.username === username && user.id !== selectedId)
    ) {
      setError("Ese usuario ya existe.")
      return
    }

    if (selectedId) {
      setUsers((previous) =>
        previous.map((user) =>
          user.id === selectedId
            ? { ...user, username, password: form.password, role: form.role }
            : user,
        ),
      )

      setMessage("Usuario actualizado.")
    } else {
      setUsers((previous) => [
        ...previous,
        {
          id: Date.now().toString(),
          username,
          password: form.password,
          role: form.role,
          permissions: [],
          active: true,
        },
      ])

      setMessage("Usuario creado.")
    }

    resetForm()
  }

  function editUser(user: AppUser) {
    setSelectedId(user.id)

    setForm({
      username: user.username,
      password: user.password,
      role: user.role,
    })

    setSection("list")
  }

  function toggleActive(user: AppUser) {
    if (!canEditUser || user.username === "admin") return

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id ? { ...item, active: !item.active } : item,
      ),
    )
  }

  if (!canManage)
    return (
      <div className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 p-5 text-sm text-[#FF6B50]">
        No tienes permiso para administrar usuarios.
      </div>
    )

  return (
    <div className="space-y-5">
      <div className="border-b border-[#292929] pb-4">
        <div className="text-[10px] text-[#666] uppercase tracking-[0.2em]">
          Administración de acceso
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Usuarios</h2>
      </div>

      {message && (
        <div className="border border-[#00E87A]/40 bg-[#00E87A]/5 px-4 py-3 text-xs text-[#00E87A]">
          {message}
        </div>
      )}
      {error && (
        <div className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 px-4 py-3 text-xs text-[#FF6B50]">
          {error}
        </div>
      )}

      {section === "permissions" && (
        <section className="space-y-5">
          <div className="border border-[#292929] bg-[#0d0d0d]">
            <div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">
              Permisos existentes
            </div>
            <div className="divide-y divide-[#222]">
              {availablePermissions.map((permission) => (
                <div key={permission.key} className="px-4 py-4">
                  <div className="font-bold text-white">{permission.label}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-[#FFB800]">
                    {permission.key}
                  </div>
                  <div className="mt-1 text-xs text-[#666]">
                    {permission.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {section === "roles" && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border border-[#292929] bg-[#0d0d0d]">
            <div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">
              Roles disponibles
            </div>
            <div className="divide-y divide-[#222]">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between gap-3 px-4 py-4"
                >
                  <div>
                    <div className="font-bold text-white">{role.label}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-[#777]">
                      {role.key} · {role.permissions.length} permisos
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editRole(role)}
                      className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-white cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removeRole(role)}
                      disabled={role.system}
                      className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-[#FF2D00] disabled:opacity-30 cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-[#292929] bg-[#0d0d0d] p-4">
            <div className="text-xs uppercase tracking-wider text-[#aaa] mb-4">
              {selectedRoleId ? "Editar rol" : "Nuevo rol"}
            </div>
            <div className="space-y-3">
              <input
                value={roleForm.key}
                onChange={(event) =>
                  setRoleForm((previous) => ({
                    ...previous,
                    key: event.target.value,
                  }))
                }
                placeholder="Clave del rol"
                disabled={Boolean(selectedRoleId)}
                className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none disabled:opacity-50"
              />
              <input
                value={roleForm.label}
                onChange={(event) =>
                  setRoleForm((previous) => ({
                    ...previous,
                    label: event.target.value,
                  }))
                }
                placeholder="Nombre del rol"
                className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none"
              />
              <div className="border border-[#252525] p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-[#777]">
                  Permisos del rol
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start gap-2 text-xs text-[#aaa]"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(permission.key)}
                        onChange={() => toggleRolePermission(permission.key)}
                        className="mt-0.5 accent-[#FFB800]"
                      />
                      <span>{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveRole}
                  className="flex-1 bg-white px-3 py-2.5 text-[10px] font-bold uppercase text-black cursor-pointer"
                >
                  {selectedRoleId ? "Guardar cambios" : "Crear rol"}
                </button>
                {selectedRoleId && (
                  <button
                    onClick={resetRoleForm}
                    className="border border-[#333] px-3 py-2.5 text-[10px] uppercase text-[#888] cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {section === "list" && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border border-[#292929] bg-[#0d0d0d]">
            <div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">
              Lista de usuarios
            </div>
            <div className="divide-y divide-[#222]">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                >
                  <div>
                    <div className="font-bold text-white">{user.username}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#777] mt-1">
                      {roleLabel(user.role)} ·{" "}
                      {user.active ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editUser(user)}
                      className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-white cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={user.username === "admin"}
                      className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-[#FFB800] disabled:opacity-30 cursor-pointer"
                    >
                      {user.active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-[#292929] bg-[#0d0d0d] p-4">
            <div className="text-xs uppercase tracking-wider text-[#aaa] mb-4">
              {selectedId ? "Editar usuario" : "Nuevo usuario"}
            </div>
            <div className="space-y-3">
              <input
                value={form.username}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    username: event.target.value,
                  }))
                }
                placeholder="Usuario"
                className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none"
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                placeholder="Contraseña"
                className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none"
              />
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    role: event.target.value as UserRole,
                  }))
                }
                className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={saveUser}
                  className="flex-1 bg-white px-3 py-2.5 text-[10px] font-bold uppercase text-black cursor-pointer"
                >
                  {selectedId ? "Guardar" : "Crear usuario"}
                </button>
                {selectedId && (
                  <button
                    onClick={resetForm}
                    className="border border-[#333] px-3 py-2.5 text-[10px] uppercase text-[#888] cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
