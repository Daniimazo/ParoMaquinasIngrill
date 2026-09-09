import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, formatDate, formatTime, isAdminUser } from '../store'
import { useState, useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, currentUser } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'maquinas' | 'herramientas' | null>(null)

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
    { to: '/maquinas?tab=activos', label: 'Paros activos' },
    { to: '/maquinas?tab=registro', label: 'Registrar paro' },
    { to: '/maquinas?tab=historial', label: 'Historial' },
    ...(isAdminUser(currentUser) ? [{ to: '/maquinas?tab=catalogo', label: 'Catálogo' }] : []),
  ]
  const toolSubmenu = [
    { to: '/herramientas', label: 'Panel' },
    { to: '/herramientas?view=catalogo', label: 'Catálogo' },
    { to: '/herramientas?view=bitacora', label: 'Bitácora' },
  ]
  const pageTitle = location.pathname === '/herramientas' ? 'Herramientas' : location.pathname === '/listas' ? 'Listas' : location.pathname === '/' ? 'Inicio' : 'Máquinas'

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

          {isAdminUser(currentUser) && <NavLink to="/listas" onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-wider border-l-2 transition-colors ${isActive ? 'bg-[#191919] text-white border-[#FFB800]' : 'text-[#777] border-transparent hover:bg-[#151515] hover:text-[#ddd]'}`}>
            <span className="w-5 text-center text-sm font-bold" aria-hidden="true">☷</span><span>Listas</span>
          </NavLink>}
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
        <header className="relative h-[86px] border-b border-[#252525] px-5 sm:px-8 pl-16 flex items-center justify-between gap-4 bg-[#0a0a0a]">
          <button aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="absolute left-5 top-6 text-xl text-[#aaa] hover:text-white cursor-pointer">☰</button>
          <div>
            <div className="text-[10px] text-[#666] uppercase tracking-[0.2em]">CONTROL DE PLANTA</div>
            <h1 className="text-xl font-bold text-white mt-1">{pageTitle}</h1>
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
