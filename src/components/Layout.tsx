import { NavLink, useNavigate } from 'react-router-dom'
import { useStore, formatDate, formatTime } from '../store'
import { useState, useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, currentUser } = useStore()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/maquinas', label: 'Máquinas' },
    { to: '/herramientas', label: 'Herramientas' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8]">
      <header className="border-b border-[#222] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-[#555] tracking-widest uppercase">Sistema de</span>
            <span className="text-lg font-bold tracking-tight text-white leading-none">CONTROL DE PLANTA</span>
          </div>
          <div className="hidden sm:block w-px h-10 bg-[#222]" />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-[#555]">{formatDate(now)}</span>
            <span className="text-sm font-mono text-[#888]">{formatTime(now)}</span>
          </div>
        </div>

        <nav className="flex gap-1 flex-wrap justify-center">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${isActive ? 'bg-white text-black border-white' : 'bg-transparent text-[#555] border-[#222] hover:text-[#aaa] hover:border-[#444]'}`
              }>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-[#555] uppercase tracking-widest">Usuario</span>
            <span className="text-sm font-bold text-white">{currentUser}</span>
          </div>
          <button onClick={handleLogout}
            className="px-3 py-2 text-xs uppercase tracking-widest font-semibold border border-[#222] text-[#555] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-all cursor-pointer">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
