import { useState } from 'react'
import { useStore, formatDate, formatTime, formatDuration } from '../store'

export default function DashboardPage() {
  const { machines, events, setEvents, ticker: _ticker, currentUser } = useStore()
  const [solutionModal, setSolutionModal] = useState<string | null>(null)
  const [solutionText, setSolutionText] = useState('')
  const [newMachine, setNewMachine] = useState(machines[0]?.name ?? '')
  const [newDesc, setNewDesc] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [customMachine, setCustomMachine] = useState('')
  const [historyFilter, setHistoryFilter] = useState('ALL')
  const [tab, setTab] = useState<'paros' | 'registro' | 'historial'>('paros')

  const activeEvents = events.filter(e => e.status === 'down')
  const machinesDown = new Set(activeEvents.map(e => e.machine)).size
  const machinesRunning = machines.length - machinesDown
  const downMachineNames = new Set(activeEvents.map(e => e.machine))

  const historyEvents = [...events]
    .filter(e => historyFilter === 'ALL' || e.machine === historyFilter)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  const historyMachines = [...new Set(events.map(e => e.machine))].sort()

  function registerStop() {
    const machine = useCustom ? customMachine.trim().toUpperCase() : newMachine
    if (!machine || !newDesc.trim()) return
    setEvents(prev => [{ id: Date.now().toString(), machine, description: newDesc.trim(), startTime: new Date(), endTime: null, solution: null, status: 'down', reportedBy: currentUser, resolvedBy: null }, ...prev])
    setNewDesc(''); setCustomMachine(''); setTab('paros')
  }

  function resolveStop() {
    if (!solutionModal || !solutionText.trim()) return
    setEvents(prev => prev.map(e => e.id === solutionModal ? { ...e, endTime: new Date(), solution: solutionText.trim(), status: 'running', resolvedBy: currentUser } : e))
    setSolutionModal(null); setSolutionText('')
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="border border-[#FF2D00] p-6 relative overflow-hidden">
          {machinesDown > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF2D00] pulse-red m-3" />}
          <div className="text-xs text-[#FF2D00] uppercase tracking-widest mb-2">{machinesDown > 0 ? '● EN PARO' : '○ EN PARO'}</div>
          <div className="text-6xl sm:text-7xl font-extrabold text-[#FF2D00] leading-none tabular-nums">{machinesDown}</div>
          <div className="text-xs text-[#555] mt-3 uppercase tracking-wider">{machinesDown === 1 ? 'máquina detenida' : 'máquinas detenidas'}</div>
        </div>
        <div className="border border-[#222] p-6">
          <div className="text-xs text-[#00E87A] uppercase tracking-widest mb-2">● EN PRODUCCIÓN</div>
          <div className="text-6xl sm:text-7xl font-extrabold text-[#00E87A] leading-none tabular-nums">{machinesRunning}</div>
          <div className="text-xs text-[#555] mt-3 uppercase tracking-wider">{machinesRunning === 1 ? 'máquina activa' : 'máquinas activas'}</div>
        </div>
      </div>

      {/* Availability bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#555] uppercase tracking-widest">Disponibilidad</span>
          <span className="text-xs text-[#888]">{machines.length ? Math.round((machinesRunning / machines.length) * 100) : 0}%</span>
        </div>
        <div className="w-full h-2 bg-[#111] border border-[#222]">
          <div className="h-full bg-[#00E87A] transition-all duration-700" style={{ width: `${machines.length ? (machinesRunning / machines.length) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-[#444] mt-1"><span>0</span><span>{machines.length} total</span></div>
      </div>

      {/* Machine grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-xs uppercase tracking-widest text-[#555] font-semibold">Estado de planta</div>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {machines.map(m => {
            const isDown = downMachineNames.has(m.name)
            return (
              <div key={m.id} className={`p-3 border text-center text-xs font-bold tracking-wider transition-all ${isDown ? 'border-[#FF2D00]/60 bg-[#FF2D00]/10 text-[#FF6B50]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#00E87A]'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1.5 ${isDown ? 'bg-[#FF2D00] pulse-red' : 'bg-[#00E87A]'}`} />
                {m.name}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs: Paros / Registrar / Historial */}
      <div>
        <div className="flex gap-1 mb-6 border-b border-[#1a1a1a] pb-4">
          {(['paros', 'registro', 'historial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${tab === t ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>
              {t === 'paros' ? `Paros activos${activeEvents.length > 0 ? ` (${activeEvents.length})` : ''}` : t === 'registro' ? 'Registrar paro' : 'Historial'}
            </button>
          ))}
        </div>

        {/* Tab: Paros activos */}
        {tab === 'paros' && (
          activeEvents.length === 0 ? (
            <div className="border border-[#222] p-10 text-center">
              <div className="text-4xl mb-3">✓</div>
              <div className="text-sm text-[#00E87A] uppercase tracking-widest">Sin paros activos</div>
              <div className="text-xs text-[#444] mt-1">Todas las máquinas en producción</div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeEvents.map(ev => (
                <div key={ev.id} className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs bg-[#FF2D00] text-white px-2 py-0.5 font-bold tracking-wider">{ev.machine}</span>
                      <span className="text-xs text-[#FF6B50] font-mono blink">● {formatDuration(ev.startTime, null)}</span>
                    </div>
                    <p className="text-sm text-[#aaa] truncate">{ev.description}</p>
                    <p className="text-xs text-[#555] mt-1">
                      Inicio: {formatDate(ev.startTime)} {formatTime(ev.startTime)}
                      {' · '}Reportó: <span className="text-[#777]">{ev.reportedBy}</span>
                    </p>
                  </div>
                  <button onClick={() => { setSolutionModal(ev.id); setSolutionText('') }}
                    className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest font-bold border border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black transition-all cursor-pointer">
                    Levantar Paro
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab: Registro */}
        {tab === 'registro' && (
          <div className="max-w-xl space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">Máquina</label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setUseCustom(false)} className={`px-3 py-1 text-xs border transition-all cursor-pointer ${!useCustom ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:border-[#444]'}`}>Lista</button>
                <button onClick={() => setUseCustom(true)} className={`px-3 py-1 text-xs border transition-all cursor-pointer ${useCustom ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:border-[#444]'}`}>Otra</button>
              </div>
              {!useCustom ? (
                <select value={newMachine} onChange={e => setNewMachine(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors">
                  {machines.map(m => <option key={m.id} value={m.name}>{m.name}{m.area ? ` — ${m.area}` : ''}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Ej: TORNO-03" value={customMachine} onChange={e => setCustomMachine(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white placeholder-[#444] transition-colors uppercase" />
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">Descripción del paro</label>
              <textarea rows={5} placeholder="Describe el motivo del paro, síntomas observados, condiciones..." value={newDesc} onChange={e => setNewDesc(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white placeholder-[#444] resize-none transition-colors" />
              <div className="text-xs text-[#444] mt-1 text-right">{newDesc.length} caracteres</div>
            </div>
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#555] uppercase tracking-wider">Hora de registro</span>
              <span className="text-sm text-[#888] font-mono">{formatTime(new Date())} — {formatDate(new Date())}</span>
            </div>
            <button onClick={registerStop} disabled={!newDesc.trim() || (useCustom && !customMachine.trim())}
              className="w-full py-4 text-sm uppercase tracking-widest font-bold bg-[#FF2D00] text-white hover:bg-[#FF4422] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
              Registrar Paro
            </button>
          </div>
        )}

        {/* Tab: Historial */}
        {tab === 'historial' && (
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <button onClick={() => setHistoryFilter('ALL')} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${historyFilter === 'ALL' ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>Todas</button>
              {historyMachines.map(m => (
                <button key={m} onClick={() => setHistoryFilter(m)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${historyFilter === m ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>{m}</button>
              ))}
            </div>
            {historyEvents.length === 0 && <div className="border border-[#1a1a1a] p-10 text-center text-[#444] text-sm">Sin registros{historyFilter !== 'ALL' ? ` para ${historyFilter}` : ''}.</div>}
            <div className="space-y-3">
              {historyEvents.map(ev => (
                <div key={ev.id} className={`border p-5 transition-all ${ev.status === 'down' ? 'border-[#FF2D00]/40 bg-[#FF2D00]/5' : 'border-[#1a1a1a] bg-[#0a0a0a]'}`}>
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    <span className={`text-xs px-2 py-0.5 font-bold tracking-wider ${ev.status === 'down' ? 'bg-[#FF2D00] text-white' : 'bg-[#00E87A]/10 text-[#00E87A] border border-[#00E87A]/30'}`}>{ev.machine}</span>
                    <span className={`text-xs px-2 py-0.5 border font-semibold uppercase tracking-wider ${ev.status === 'down' ? 'border-[#FF2D00]/50 text-[#FF6B50]' : 'border-[#1a1a1a] text-[#555]'}`}>{ev.status === 'down' ? '● Activo' : '✓ Resuelto'}</span>
                    <span className="text-xs text-[#555] ml-auto font-mono">{formatDate(ev.startTime)} {formatTime(ev.startTime)}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#444] uppercase tracking-wider mb-1">Motivo</div>
                      <p className="text-sm text-[#bbb] leading-relaxed">{ev.description}</p>
                    </div>
                    {ev.solution ? (
                      <div>
                        <div className="text-xs text-[#00E87A]/60 uppercase tracking-wider mb-1">Solución</div>
                        <p className="text-sm text-[#bbb] leading-relaxed">{ev.solution}</p>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button onClick={() => { setSolutionModal(ev.id); setSolutionText('') }}
                          className="px-4 py-2 text-xs uppercase tracking-widest font-bold border border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black transition-all cursor-pointer">
                          Levantar Paro
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#444]">
                    <span>Inicio: <span className="text-[#666]">{formatTime(ev.startTime)}</span></span>
                    {ev.endTime && <span>Fin: <span className="text-[#666]">{formatTime(ev.endTime)}</span></span>}
                    <span>Duración: <span className={ev.status === 'down' ? 'text-[#FF6B50]' : 'text-[#666]'}>{formatDuration(ev.startTime, ev.endTime)}</span></span>
                    <span>Reportó: <span className="text-[#666] uppercase">{ev.reportedBy}</span></span>
                    {ev.resolvedBy && <span>Resolvió: <span className="text-[#00E87A]/70 uppercase">{ev.resolvedBy}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Solution modal */}
      {solutionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setSolutionModal(null) }}>
          <div className="bg-[#0d0d0d] border border-[#333] w-full max-w-lg p-6">
            <div className="mb-6">
              <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Cierre de evento</div>
              <h3 className="text-xl font-bold text-white">Levantar Paro</h3>
              <p className="text-xs text-[#555] mt-1">Máquina: <span className="text-[#888]">{events.find(e => e.id === solutionModal)?.machine}</span></p>
            </div>
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">¿Cómo se solucionó?</label>
              <textarea rows={5} autoFocus placeholder="Describe la acción correctiva tomada, refacciones usadas, tiempo de reparación..." value={solutionText} onChange={e => setSolutionText(e.target.value)}
                className="w-full bg-[#080808] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#00E87A] placeholder-[#333] resize-none transition-colors" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSolutionModal(null)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>
              <button onClick={resolveStop} disabled={!solutionText.trim()} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold bg-[#00E87A] text-black hover:bg-[#00FF87] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">Confirmar Levantamiento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
