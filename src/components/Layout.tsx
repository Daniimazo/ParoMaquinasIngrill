import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, formatDate, formatTime, isAdminUser, canManageUsers } from '../store'
import { useState, useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, currentUser, users } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'maquinas' | 'herramientas' | 'anadir' | 'agregarMaquinas' | 'agregarHerramientas' | 'usuarios' | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const machineSubmenu = [
    { to: '/maquinas', label: 'Resumen' },
    { to: '/maquinas?tab=registro', label: 'Registrar paro' },
    { to: '/maquinas?tab=historial', label: 'Historial' },
  ]
  const toolSubmenu = [
    { to: '/herramientas?view=panel', label: 'Panel' },
    { to: '/herramientas?view=bitacora', label: 'Bitácora' },
  ]
  const addSubmenu = [
    { to: '/listas?list=areas', label: 'Añadir área' },
    { to: '/listas?list=stopTypes', label: 'Añadir tipo de paro' },
  ]
  const addMachineSubmenu = [
    { to: '/maquinas?tab=catalogo', label: 'Añadir máquina' },
    { to: '/listas?list=machineTypes', label: 'Añadir tipo de máquina' },
  ]
  const addToolSubmenu = [
    { to: '/herramientas?view=catalogo', label: 'Añadir herramienta' },
    { to: '/listas?list=toolTypes', label: 'Añadir tipo de herramienta' },
    { to: '/listas?list=brands', label: 'Añadir marca' },
  ]
  const userSubmenu = [
    { to: '/usuarios?section=permissions', label: 'Permisos' },
    { to: '/usuarios?section=roles', label: 'Roles' },
    { to: '/usuarios?section=list', label: 'Lista de usuarios' },
    { to: '/usuarios?section=profile', label: 'Mi perfil' },
    { to: '/usuarios?section=password', label: 'Cambiar contraseña' },
  ]
  const pageTitle = location.pathname === '/herramientas' ? 'Herramientas' : location.pathname === '/listas' ? 'Añadir' : location.pathname === '/usuarios' ? 'Usuarios' : location.pathname === '/' ? 'Inicio' : 'Máquinas'
  const agregarOpen = expandedSection === 'anadir' || expandedSection === 'agregarMaquinas' || expandedSection === 'agregarHerramientas'

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8]">
      {menuOpen && <button aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/70" />}
      <aside className={`${menuOpen ? 'fixed inset-y-0 left-0 z-40 w-60' : 'hidden'} border-r border-[#252525] bg-[#0d0d0d] flex-col`}>
        <div className="px-5 py-6 border-b border-[#252525]">
          <div className="text-[10px] text-[#666] tracking-[0.22em] uppercase">Sistema interno</div>
          <div className="text-lg font-bold text-white tracking-tight mt-1">CONTROL DE PLANTA</div>
          <div className="text-[10px] text-[#555] uppercase tracking-widest mt-3">Módulo operativo</div>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] text-[#555] uppercase tracking-[0.2em]">Navegación</div>
          <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${isActive ? 'bg-[#191919] text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
            <span className="w-5 text-center text-sm font-bold" aria-hidden="true">⌂</span><span>Inicio</span>
          </NavLink>

          <button onClick={() => setExpandedSection(expandedSection === 'maquinas' ? null : 'maquinas')} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${location.pathname === '/maquinas' ? 'text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
            <span className="w-5 text-center text-sm font-bold" aria-hidden="true">▦</span><span className="flex-1 text-left">Máquinas</span><span>{expandedSection === 'maquinas' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'maquinas' && <div className="ml-8 border-l border-[#333] pl-2 space-y-1">
            {machineSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[11px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#666] hover:text-white'}` }}>{item.label}</NavLink>)}
          </div>}

          <button onClick={() => setExpandedSection(expandedSection === 'herramientas' ? null : 'herramientas')} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${location.pathname === '/herramientas' ? 'text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
            <span className="w-5 text-center text-sm font-bold" aria-hidden="true">⚙</span><span className="flex-1 text-left">Herramientas</span><span>{expandedSection === 'herramientas' ? '−' : '+'}</span>
          </button>
          {expandedSection === 'herramientas' && <div className="ml-8 border-l border-[#333] pl-2 space-y-1">
            {toolSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[11px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#666] hover:text-white'}` }}>{item.label}</NavLink>)}
          </div>}

          {isAdminUser(currentUser) && <>
            <button onClick={() => setExpandedSection(agregarOpen ? null : 'anadir')} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${location.pathname === '/listas' || (location.pathname === '/maquinas' && location.search === '?tab=catalogo') || (location.pathname === '/herramientas' && location.search === '?view=catalogo') ? 'text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
              <span className="w-5 text-center text-sm font-bold" aria-hidden="true">＋</span><span className="flex-1 text-left">Añadir</span><span>{agregarOpen ? '−' : '+'}</span>
            </button>
            {agregarOpen && <div className="ml-8 border-l border-[#333] pl-2 space-y-1">
              <button onClick={() => setExpandedSection(expandedSection === 'agregarMaquinas' ? 'anadir' : 'agregarMaquinas')} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-left text-[#666] hover:text-white transition-colors">
                <span className="flex-1">Máquinas</span><span>{expandedSection === 'agregarMaquinas' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'agregarMaquinas' && <div className="ml-3 border-l border-[#292929] pl-2 space-y-1">
                {addMachineSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[10px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#555] hover:text-white'}` }}>{item.label}</NavLink>)}
              </div>}
              <button onClick={() => setExpandedSection(expandedSection === 'agregarHerramientas' ? 'anadir' : 'agregarHerramientas')} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-left text-[#666] hover:text-white transition-colors">
                <span className="flex-1">Herramientas</span><span>{expandedSection === 'agregarHerramientas' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'agregarHerramientas' && <div className="ml-3 border-l border-[#292929] pl-2 space-y-1">
                {addToolSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[10px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#555] hover:text-white'}` }}>{item.label}</NavLink>)}
              </div>}
              {addSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[11px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#666] hover:text-white'}` }}>{item.label}</NavLink>)}
            </div>}
          </>}

          {canManageUsers(currentUser, users) && <>
            <button onClick={() => setExpandedSection(expandedSection === 'usuarios' ? null : 'usuarios')} className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${location.pathname === '/usuarios' ? 'text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
              <span className="w-5 text-center text-sm font-bold" aria-hidden="true">♙</span><span className="flex-1 text-left">Usuarios</span><span>{expandedSection === 'usuarios' ? '−' : '+'}</span>
            </button>
            {expandedSection === 'usuarios' && <div className="ml-8 border-l border-[#333] pl-2 space-y-1">
              {userSubmenu.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={() => { const [path, search = ''] = item.to.split('?'); const active = location.pathname === path && location.search === (search ? `?${search}` : ''); return `block px-3 py-2 text-[11px] uppercase tracking-wider transition-colors ${active ? 'text-[#FFB800]' : 'text-[#666] hover:text-white'}` }}>{item.label}</NavLink>)}
            </div>}
          </>}
        </nav>
        <div className="p-4 border-t border-[#252525]">
          <div className="text-[10px] text-[#555] uppercase tracking-widest">Sesión activa</div>
          <div className="text-sm text-white font-bold uppercase mt-1">{currentUser}</div>
          <button onClick={handleLogout}
            className="w-full mt-3 px-3 py-2 text-xs uppercase tracking-widest font-semibold text-left border border-[#333] text-[#777] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-colors">
            Salir del sistema
          </button>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="h-[86px] border-b border-[#252525] px-5 sm:px-8 flex items-center justify-between gap-4 bg-[#0a0a0a]">
          <div className="flex min-w-0 items-center gap-4">
            <button aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#333] text-lg leading-none text-[#aaa] hover:border-[#777] hover:text-white cursor-pointer">☰</button>
            <div className="min-w-0">
            <div className="text-[10px] text-[#666] uppercase tracking-[0.2em]">CONTROL DE PLANTA</div>
            <h1 className="text-xl font-bold text-white mt-1">{pageTitle}</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#555] uppercase tracking-widest">Fecha de operación</div>
            <div className="text-xs text-[#aaa] font-mono mt-1">{formatDate(now)}</div>
            <div className="text-sm text-[#FFB800] font-mono">{formatTime(now)}</div>
          </div>
        </header>

        <main className="px-5 sm:px-8 py-6 max-w-[1500px]">
        {children}
        </main>
      </div>
    </div>
  )
}
