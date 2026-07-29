import { useState } from 'react'
import { useStore, formatDate, formatTime, formatDuration } from '../store'
import type { Machine } from '../store'

type Tab = 'panel' | 'activos' | 'registro' | 'historial' | 'catalogo'

export default function MaquinasPage() {
  const { machines, setMachines, events, setEvents, currentUser, ticker: _ticker } = useStore()
  const [tab, setTab] = useState<Tab>('panel')

  // ── Derived ──
  const activeEvents = events.filter(e => e.status === 'down')
  const machinesDown = new Set(activeEvents.map(e => e.machine)).size
  const machinesRunning = machines.length - machinesDown
  const downMachineNames = new Set(activeEvents.map(e => e.machine))

  // ── Register stop ──
  const [newMachine, setNewMachine] = useState(machines[0]?.name ?? '')
  const [useCustom, setUseCustom] = useState(false)
  const [customMachine, setCustomMachine] = useState('')
  const [newDesc, setNewDesc] = useState('')

  function registerStop() {
    const machine = useCustom ? customMachine.trim().toUpperCase() : newMachine
    if (!machine || !newDesc.trim()) return
    setEvents(prev => [{
      id: Date.now().toString(), machine, description: newDesc.trim(),
      startTime: new Date(), endTime: null, solution: null,
      status: 'down', reportedBy: currentUser, resolvedBy: null,
    }, ...prev])
    setNewDesc(''); setCustomMachine(''); setTab('activos')
  }

  // ── Resolve stop ──
  const [solutionModal, setSolutionModal] = useState<string | null>(null)
  const [solutionText, setSolutionText] = useState('')

  function resolveStop() {
    if (!solutionModal || !solutionText.trim()) return
    setEvents(prev => prev.map(e => e.id === solutionModal
      ? { ...e, endTime: new Date(), solution: solutionText.trim(), status: 'running', resolvedBy: currentUser }
      : e))
    setSolutionModal(null); setSolutionText('')
  }

  // ── Historial ──
  const [historyFilter, setHistoryFilter] = useState('ALL')
  const historyMachines = [...new Set(events.map(e => e.machine))].sort()
  const historyEvents = [...events]
    .filter(e => historyFilter === 'ALL' || e.machine === historyFilter)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

  // ── CRUD ──
  const [form, setForm] = useState({ name: '', area: '', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  function openNew() { setEditingId(null); setForm({ name: '', area: '', notes: '' }); setFormError('') }
  function openEdit(m: Machine) { setEditingId(m.id); setForm({ name: m.name, area: m.area, notes: m.notes }); setFormError('') }
  function saveMachine() {
    const name = form.name.trim().toUpperCase()
    if (!name) { setFormError('El nombre es requerido.'); return }
    if (machines.some(m => m.name === name && m.id !== editingId)) { setFormError('Ya existe una máquina con ese nombre.'); return }
    if (editingId) {
      setMachines(prev => prev.map(m => m.id === editingId ? { ...m, name, area: form.area.trim(), notes: form.notes.trim() } : m))
    } else {
      setMachines(prev => [...prev, { id: Date.now().toString(), name, area: form.area.trim(), notes: form.notes.trim() }])
    }
    openNew()
  }
  function removeMachine(id: string) {
    setMachines(prev => prev.filter(m => m.id !== id))
    setDeleteConfirm(null)
    if (editingId === id) openNew()
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'panel', label: 'Panel' },
    { key: 'activos', label: `Paros activos${activeEvents.length > 0 ? ` (${activeEvents.length})` : ''}` },
    { key: 'registro', label: 'Registrar paro' },
    { key: 'historial', label: 'Historial' },
    { key: 'catalogo', label: 'Catálogo' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Control de</div>
        <h1 className="text-3xl font-extrabold text-white">Máquinas</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap mb-8 pb-6 border-b border-[#1a1a1a]">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${tab === key ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PANEL ── */}
      {tab === 'panel' && (
        <div className="space-y-8">
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
                    {m.area && <div className="text-[#444] font-normal mt-0.5 text-[10px]">{m.area}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {activeEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xs uppercase tracking-widest text-[#FF2D00] font-semibold">Paros activos</div>
                <div className="flex-1 h-px bg-[#FF2D00]/20" />
                <button onClick={() => setTab('activos')} className="text-xs text-[#555] hover:text-[#aaa] transition-colors cursor-pointer">Ver todos →</button>
              </div>
              <div className="space-y-2">
                {activeEvents.slice(0, 3).map(ev => (
                  <div key={ev.id} className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs bg-[#FF2D00] text-white px-2 py-0.5 font-bold tracking-wider">{ev.machine}</span>
                        <span className="text-xs text-[#FF6B50] font-mono blink">● {formatDuration(ev.startTime, null)}</span>
                      </div>
                      <p className="text-xs text-[#888] truncate">{ev.description}</p>
                    </div>
                    <button onClick={() => { setSolutionModal(ev.id); setSolutionText('') }}
                      className="shrink-0 px-3 py-1.5 text-xs uppercase tracking-widest font-bold border border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black transition-all cursor-pointer">
                      Levantar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PAROS ACTIVOS ── */}
      {tab === 'activos' && (
        activeEvents.length === 0 ? (
          <div className="border border-[#222] p-14 text-center">
            <div className="text-4xl mb-3">✓</div>
            <div className="text-sm text-[#00E87A] uppercase tracking-widest">Sin paros activos</div>
            <div className="text-xs text-[#444] mt-1">Todas las máquinas en producción</div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEvents.map(ev => (
              <div key={ev.id} className="border border-[#FF2D00]/40 bg-[#FF2D00]/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs bg-[#FF2D00] text-white px-2 py-0.5 font-bold tracking-wider">{ev.machine}</span>
                    <span className="text-xs text-[#FF6B50] font-mono blink">● {formatDuration(ev.startTime, null)}</span>
                  </div>
                  <p className="text-sm text-[#aaa] mb-2">{ev.description}</p>
                  <div className="flex flex-wrap gap-x-4 text-xs text-[#555]">
                    <span>Inicio: {formatDate(ev.startTime)} {formatTime(ev.startTime)}</span>
                    <span>Reportó: <span className="text-[#777] uppercase">{ev.reportedBy}</span></span>
                  </div>
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

      {/* ── REGISTRO ── */}
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

          <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#555] uppercase tracking-wider mb-0.5">Hora de registro</div>
              <div className="text-sm text-[#888] font-mono">{formatTime(new Date())}</div>
            </div>
            <div>
              <div className="text-xs text-[#555] uppercase tracking-wider mb-0.5">Registrado por</div>
              <div className="text-sm text-white font-bold uppercase">{currentUser}</div>
            </div>
          </div>

          <button onClick={registerStop} disabled={!newDesc.trim() || (useCustom && !customMachine.trim())}
            className="w-full py-4 text-sm uppercase tracking-widest font-bold bg-[#FF2D00] text-white hover:bg-[#FF4422] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            Registrar Paro
          </button>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === 'historial' && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="text-xs text-[#444]">{historyEvents.length} eventos</div>
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            <button onClick={() => setHistoryFilter('ALL')} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${historyFilter === 'ALL' ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>Todas</button>
            {historyMachines.map(m => (
              <button key={m} onClick={() => setHistoryFilter(m)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${historyFilter === m ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>{m}</button>
            ))}
          </div>
          {historyEvents.length === 0 && <div className="border border-[#1a1a1a] p-12 text-center text-[#444] text-sm">Sin registros{historyFilter !== 'ALL' ? ` para ${historyFilter}` : ''}.</div>}
          <div className="space-y-3">
            {historyEvents.map(ev => (
              <div key={ev.id} className={`border p-5 transition-all ${ev.status === 'down' ? 'border-[#FF2D00]/40 bg-[#FF2D00]/5' : 'border-[#1a1a1a] bg-[#0a0a0a]'}`}>
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <span className={`text-xs px-2 py-0.5 font-bold tracking-wider ${ev.status === 'down' ? 'bg-[#FF2D00] text-white' : 'bg-[#00E87A]/10 text-[#00E87A] border border-[#00E87A]/30'}`}>{ev.machine}</span>
                  <span className={`text-xs px-2 py-0.5 border font-semibold uppercase tracking-wider ${ev.status === 'down' ? 'border-[#FF2D00]/50 text-[#FF6B50]' : 'border-[#1a1a1a] text-[#555]'}`}>{ev.status === 'down' ? '● Activo' : '✓ Resuelto'}</span>
                  <span className="text-xs text-[#555] ml-auto font-mono">{formatDate(ev.startTime)} {formatTime(ev.startTime)}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-3">
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
                <div className="pt-3 border-t border-[#1a1a1a] flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#444]">
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

      {/* ── CATÁLOGO ── */}
      {tab === 'catalogo' && (
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="border border-[#222] p-5 sticky top-6">
              <div className="text-xs text-[#555] uppercase tracking-widest mb-1">{editingId ? 'Editando' : 'Nueva máquina'}</div>
              <h3 className="text-lg font-bold text-white mb-5">{editingId ? machines.find(m => m.id === editingId)?.name : 'Agregar'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Nombre / Clave <span className="text-[#FF2D00]">*</span></label>
                  <input type="text" placeholder="Ej: TORNO-03" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError('') }}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors uppercase" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Área / Departamento</label>
                  <input type="text" placeholder="Ej: Maquinado" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Notas</label>
                  <textarea rows={3} placeholder="Descripción, modelo, ubicación..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] resize-none transition-colors" />
                </div>
                {formError && <div className="text-xs text-[#FF2D00] border border-[#FF2D00]/30 bg-[#FF2D00]/5 px-3 py-2">{formError}</div>}
                <div className="flex gap-2 pt-1">
                  {editingId && <button onClick={openNew} className="px-4 py-2.5 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>}
                  <button onClick={saveMachine} className="flex-1 py-2.5 text-xs uppercase tracking-widest font-bold bg-white text-black hover:bg-[#e8e8e8] transition-all cursor-pointer">{editingId ? 'Guardar cambios' : 'Agregar máquina'}</button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-end justify-between mb-4">
              <div className="text-xs text-[#444]">{machines.length} registros</div>
            </div>
            {machines.length === 0 && <div className="border border-[#1a1a1a] p-10 text-center text-[#444] text-sm">Sin máquinas registradas.</div>}
            <div className="space-y-2">
              {machines.map(m => {
                const isDown = downMachineNames.has(m.name)
                const isEditing = editingId === m.id
                return (
                  <div key={m.id} className={`border p-4 transition-all ${isEditing ? 'border-white bg-[#0d0d0d]' : 'border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isDown ? 'bg-[#FF2D00] pulse-red' : 'bg-[#00E87A]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{m.name}</span>
                          {m.area && <span className="text-xs text-[#555] border border-[#222] px-2 py-0.5">{m.area}</span>}
                          <span className={`text-xs ml-auto ${isDown ? 'text-[#FF6B50]' : 'text-[#555]'}`}>{isDown ? '● EN PARO' : '● ACTIVA'}</span>
                        </div>
                        {m.notes && <p className="text-xs text-[#555] mt-1 truncate">{m.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => isEditing ? openNew() : openEdit(m)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-white hover:border-white transition-all cursor-pointer">{isEditing ? 'Esc' : 'Editar'}</button>
                        <button onClick={() => setDeleteConfirm(m.id)} disabled={isDown} title={isDown ? 'Máquina en paro activo' : ''} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
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
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 mb-5 flex items-center justify-between">
              <span className="text-xs text-[#555] uppercase tracking-wider">Resuelto por</span>
              <span className="text-sm font-bold text-white uppercase">{currentUser}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSolutionModal(null)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>
              <button onClick={resolveStop} disabled={!solutionText.trim()} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold bg-[#00E87A] text-black hover:bg-[#00FF87] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">Confirmar Levantamiento</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="bg-[#0d0d0d] border border-[#FF2D00]/40 w-full max-w-sm p-6">
            <div className="text-xs text-[#FF2D00] uppercase tracking-widest mb-1">Confirmación</div>
            <h3 className="text-xl font-bold text-white mb-2">Eliminar máquina</h3>
            <p className="text-sm text-[#888] mb-1">¿Eliminar <span className="text-white font-bold">{machines.find(m => m.id === deleteConfirm)?.name}</span>?</p>
            <p className="text-xs text-[#555] mb-6">El historial de paros se conservará.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>
              <button onClick={() => removeMachine(deleteConfirm)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold bg-[#FF2D00] text-white hover:bg-[#FF4422] transition-all cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
