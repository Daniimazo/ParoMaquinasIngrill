import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, canManageUsers } from '../store'
import type { AppUser, Permission, UserRole } from '../store'

type UserSection = 'permissions' | 'roles' | 'list' | 'profile' | 'password'

const SECTIONS: { key: UserSection; label: string }[] = [
  { key: 'permissions', label: 'Permisos' },
  { key: 'roles', label: 'Roles' },
  { key: 'list', label: 'Lista de usuarios' },
  { key: 'profile', label: 'Mi perfil' },
  { key: 'password', label: 'Cambiar contraseña' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrativo',
  supervisor: 'Supervisor',
  operador: 'Operador',
}

export default function UsuariosPage() {
  const { currentUser, users, setUsers, availablePermissions, setAvailablePermissions } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [section, setSection] = useState<UserSection>('list')
  const [selectedId, setSelectedId] = useState(users.find(user => user.username === currentUser)?.id ?? '')
  const [form, setForm] = useState({ username: '', password: '', role: 'operador' as UserRole })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [permissionForm, setPermissionForm] = useState({ key: '', label: '', description: '' })
  const [showPermissionForm, setShowPermissionForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canManage = canManageUsers(currentUser, users)
  const canEditPermissions = currentUser === 'admin' || users.find(user => user.username === currentUser)?.permissions.includes('users.permissions') === true
  const selectedUser = users.find(user => user.id === selectedId)
  const currentAccount = users.find(user => user.username === currentUser)

  useEffect(() => {
    const requested = searchParams.get('section') as UserSection | null
    if (requested && SECTIONS.some(item => item.key === requested)) setSection(requested)
  }, [searchParams])

  function changeSection(next: UserSection) {
    setSection(next)
    setSearchParams({ section: next })
    setError('')
    setMessage('')
  }

  function resetForm() {
    setForm({ username: '', password: '', role: 'operador' })
    setSelectedId('')
    setError('')
  }

  function saveUser() {
    if (!canManage) return
    const username = form.username.trim().toLowerCase()
    if (!username || !form.password) { setError('Usuario y contraseña son obligatorios.'); return }
    if (users.some(user => user.username === username && user.id !== selectedId)) { setError('Ese usuario ya existe.'); return }
    if (selectedId) {
      setUsers(previous => previous.map(user => user.id === selectedId ? { ...user, username, password: form.password, role: form.role } : user))
      setMessage('Usuario actualizado.')
    } else {
      setUsers(previous => [...previous, { id: Date.now().toString(), username, password: form.password, role: form.role, permissions: [], active: true }])
      setMessage('Usuario creado.')
    }
    resetForm()
  }

  function editUser(user: AppUser) {
    setSelectedId(user.id)
    setForm({ username: user.username, password: user.password, role: user.role })
    setSection('list')
  }

  function toggleActive(user: AppUser) {
    if (!canManage || user.username === 'admin') return
    setUsers(previous => previous.map(item => item.id === user.id ? { ...item, active: !item.active } : item))
  }

  function togglePermission(user: AppUser, permission: Permission) {
    if (!canEditPermissions || user.username === 'admin') return
    setUsers(previous => previous.map(item => item.id === user.id
      ? { ...item, permissions: item.permissions.includes(permission) ? item.permissions.filter(value => value !== permission) : [...item.permissions, permission] }
      : item))
  }

  function addPermission() {
    if (!canEditPermissions) return
    const key = permissionForm.key.trim().toLowerCase().replace(/\s+/g, '.')
    const label = permissionForm.label.trim()
    const description = permissionForm.description.trim()
    if (!key || !label) { setError('Clave y nombre del permiso son obligatorios.'); return }
    if (availablePermissions.some(permission => permission.key === key)) { setError('La clave de permiso ya existe.'); return }
    setAvailablePermissions(previous => [...previous, { key, label, description }])
    setPermissionForm({ key: '', label: '', description: '' })
    setShowPermissionForm(false)
    setError('')
    setMessage('Permiso agregado.')
  }

  function changePassword() {
    if (!currentAccount) return
    if (passwordForm.current !== currentAccount.password) { setError('La contraseña actual no es correcta.'); return }
    if (!passwordForm.next || passwordForm.next !== passwordForm.confirm) { setError('Las nuevas contraseñas no coinciden.'); return }
    setUsers(previous => previous.map(user => user.id === currentAccount.id ? { ...user, password: passwordForm.next } : user))
    setPasswordForm({ current: '', next: '', confirm: '' })
    setError('')
    setMessage('Contraseña actualizada.')
  }

  if (!canManage) return <div className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 p-5 text-sm text-[#FF6B50]">No tienes permiso para administrar usuarios.</div>

  return (
    <div className="space-y-5">
      <div className="border-b border-[#292929] pb-4">
        <div className="text-[10px] text-[#666] uppercase tracking-[0.2em]">Administración de acceso</div>
        <h2 className="text-xl font-bold text-white mt-1">Usuarios</h2>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[#222] pb-4">
        {SECTIONS.map(item => <button key={item.key} onClick={() => changeSection(item.key)} className={`px-3 py-2 text-[11px] uppercase tracking-wider border cursor-pointer ${section === item.key ? 'bg-white text-black border-white' : 'border-[#333] text-[#777] hover:text-white'}`}>{item.label}</button>)}
      </div>

      {message && <div className="border border-[#00E87A]/40 bg-[#00E87A]/5 px-4 py-3 text-xs text-[#00E87A]">{message}</div>}
      {error && <div className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 px-4 py-3 text-xs text-[#FF6B50]">{error}</div>}

      {section === 'permissions' && (
        <section className="space-y-5">
          <div className="border border-[#292929] bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-[#292929] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-[#aaa]">Permisos disponibles</div>
              {canEditPermissions && <button onClick={() => { setShowPermissionForm(previous => !previous); setError('') }} className="border border-[#FFB800] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#FFB800] hover:bg-[#FFB800] hover:text-black cursor-pointer">{showPermissionForm ? 'Cancelar' : 'Agregar permiso'}</button>}
            </div>
            {showPermissionForm && <div className="grid gap-3 border-b border-[#292929] p-4 md:grid-cols-3"><input value={permissionForm.key} onChange={event => setPermissionForm(previous => ({ ...previous, key: event.target.value }))} placeholder="Clave: reports.view" className="border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><input value={permissionForm.label} onChange={event => setPermissionForm(previous => ({ ...previous, label: event.target.value }))} placeholder="Nombre del permiso" className="border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><div className="flex gap-2"><input value={permissionForm.description} onChange={event => setPermissionForm(previous => ({ ...previous, description: event.target.value }))} placeholder="Descripción" className="min-w-0 flex-1 border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><button onClick={addPermission} className="bg-white px-3 py-2 text-[10px] font-bold uppercase text-black cursor-pointer">Guardar</button></div></div>}
            <div className="divide-y divide-[#222]">{availablePermissions.map(permission => <div key={permission.key} className="px-4 py-4"><div className="font-bold text-white">{permission.label}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[#FFB800]">{permission.key}</div>{permission.description && <div className="mt-1 text-xs text-[#666]">{permission.description}</div>}</div>)}</div>
          </div>
          <div className="border border-[#292929] bg-[#0d0d0d]">
          <div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">Asignar permisos por usuario</div>
          <div className="divide-y divide-[#222]">
            {users.map(user => <div key={user.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><span className="font-bold text-white">{user.username}</span><span className="text-[10px] uppercase tracking-wider text-[#888]">{ROLE_LABELS[user.role]}</span></div>
              <div className="grid gap-2 sm:grid-cols-2">{availablePermissions.map(permission => <label key={permission.key} className="flex items-start gap-3 border border-[#252525] p-3 text-xs text-[#aaa]"><input type="checkbox" checked={user.role === 'admin' || user.permissions.includes(permission.key)} disabled={user.role === 'admin' || !canEditPermissions} onChange={() => togglePermission(user, permission.key)} className="mt-0.5 accent-[#FFB800]" /><span><span className="block text-white">{permission.label}</span><span className="mt-1 block text-[10px] text-[#666]">{permission.description}</span></span></label>)}</div>
            </div>)}
          </div>
          </div>
        </section>
      )}

      {section === 'roles' && <section className="border border-[#292929] bg-[#0d0d0d]"><div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">Roles disponibles</div><div className="divide-y divide-[#222]">{(['admin', 'supervisor', 'operador'] as UserRole[]).map(role => <div key={role} className="flex items-center justify-between px-4 py-4"><span className="font-bold text-white">{ROLE_LABELS[role]}</span><span className="text-xs text-[#777]">{role === 'admin' ? 'Acceso total al sistema' : role === 'supervisor' ? 'Operación y supervisión' : 'Operación de planta'}</span></div>)}</div></section>}

      {section === 'list' && <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="border border-[#292929] bg-[#0d0d0d]"><div className="border-b border-[#292929] px-4 py-3 text-xs uppercase tracking-wider text-[#aaa]">Lista de usuarios</div><div className="divide-y divide-[#222]">{users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><div className="font-bold text-white">{user.username}</div><div className="text-[10px] uppercase tracking-wider text-[#777] mt-1">{ROLE_LABELS[user.role]} · {user.active ? 'Activo' : 'Inactivo'}</div></div><div className="flex gap-2"><button onClick={() => editUser(user)} className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-white cursor-pointer">Editar</button><button onClick={() => toggleActive(user)} disabled={user.username === 'admin'} className="border border-[#333] px-3 py-1.5 text-[10px] uppercase text-[#888] hover:text-[#FFB800] disabled:opacity-30 cursor-pointer">{user.active ? 'Desactivar' : 'Activar'}</button></div></div>)}</div></div><div className="border border-[#292929] bg-[#0d0d0d] p-4"><div className="text-xs uppercase tracking-wider text-[#aaa] mb-4">{selectedId ? 'Editar usuario' : 'Nuevo usuario'}</div><div className="space-y-3"><input value={form.username} onChange={event => setForm(previous => ({ ...previous, username: event.target.value }))} placeholder="Usuario" className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><input type="password" value={form.password} onChange={event => setForm(previous => ({ ...previous, password: event.target.value }))} placeholder="Contraseña" className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><select value={form.role} onChange={event => setForm(previous => ({ ...previous, role: event.target.value as UserRole }))} className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none"><option value="admin">Administrativo</option><option value="supervisor">Supervisor</option><option value="operador">Operador</option></select><div className="flex gap-2"><button onClick={saveUser} className="flex-1 bg-white px-3 py-2.5 text-[10px] font-bold uppercase text-black cursor-pointer">{selectedId ? 'Guardar' : 'Crear usuario'}</button>{selectedId && <button onClick={resetForm} className="border border-[#333] px-3 py-2.5 text-[10px] uppercase text-[#888] cursor-pointer">Cancelar</button>}</div></div></div></section>}

      {section === 'profile' && currentAccount && <section className="max-w-xl border border-[#292929] bg-[#0d0d0d] p-5"><div className="text-xs uppercase tracking-wider text-[#666] mb-5">Perfil de usuario</div><div className="space-y-4"><div><div className="text-[10px] uppercase text-[#666]">Usuario</div><div className="mt-1 text-white font-bold">{currentAccount.username}</div></div><div><div className="text-[10px] uppercase text-[#666]">Rol</div><div className="mt-1 text-white">{ROLE_LABELS[currentAccount.role]}</div></div><div><div className="text-[10px] uppercase text-[#666]">Permisos delegados</div><div className="mt-1 text-white">{currentAccount.role === 'admin' ? 'Acceso total' : currentAccount.permissions.length ? currentAccount.permissions.join(', ') : 'Sin permisos especiales'}</div></div></div></section>}

      {section === 'password' && <section className="max-w-xl border border-[#292929] bg-[#0d0d0d] p-5"><div className="text-xs uppercase tracking-wider text-[#666] mb-5">Cambiar contraseña</div><div className="space-y-3"><input type="password" placeholder="Contraseña actual" value={passwordForm.current} onChange={event => setPasswordForm(previous => ({ ...previous, current: event.target.value }))} className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><input type="password" placeholder="Nueva contraseña" value={passwordForm.next} onChange={event => setPasswordForm(previous => ({ ...previous, next: event.target.value }))} className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><input type="password" placeholder="Confirmar nueva contraseña" value={passwordForm.confirm} onChange={event => setPasswordForm(previous => ({ ...previous, confirm: event.target.value }))} className="w-full border border-[#333] bg-[#080808] px-3 py-2.5 text-xs text-white outline-none" /><button onClick={changePassword} className="bg-white px-4 py-2.5 text-[10px] font-bold uppercase text-black cursor-pointer">Actualizar contraseña</button></div></section>}
    </div>
  )
}
