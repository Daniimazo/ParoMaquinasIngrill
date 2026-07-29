import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export default function LoginPage() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const ok = login(user.trim(), pass)
      if (ok) {
        navigate('/')
      } else {
        setError('Usuario o contraseña incorrectos.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      {/* Top bar decoration */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white" />

      <div className="w-full max-w-sm">
        {/* Logo block */}
        <div className="mb-10 text-center">
          <div className="inline-flex flex-col items-center">
            <div className="text-xs text-[#555] uppercase tracking-[0.3em] mb-2">Sistema de</div>
            <div className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">
              CONTROL
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight leading-none">
              DE PLANTA
            </div>
            <div className="mt-4 w-12 h-px bg-white" />
          </div>
        </div>

        {/* Card */}
        <div className="border border-[#222] bg-[#0a0a0a] p-8">
          <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Acceso</div>
          <h2 className="text-xl font-bold text-white mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                autoFocus
                autoComplete="username"
                value={user}
                onChange={e => { setUser(e.target.value); setError('') }}
                placeholder="Ej: admin"
                className="w-full bg-[#080808] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={pass}
                onChange={e => { setPass(e.target.value); setError('') }}
                placeholder="••••••••"
                className="w-full bg-[#080808] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors"
              />
            </div>

            {error && (
              <div className="text-xs text-[#FF2D00] border border-[#FF2D00]/30 bg-[#FF2D00]/5 px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!user.trim() || !pass || loading}
              className="w-full py-3.5 text-sm uppercase tracking-widest font-bold bg-white text-black hover:bg-[#e8e8e8] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="mt-5 border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
          <div className="text-xs text-[#444] uppercase tracking-widest mb-2">Usuarios de demo</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span className="text-[#666]">admin</span><span className="text-[#444]">admin123</span></div>
            <div className="flex justify-between"><span className="text-[#666]">supervisor</span><span className="text-[#444]">sup2024</span></div>
            <div className="flex justify-between"><span className="text-[#666]">operador</span><span className="text-[#444]">op1234</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
