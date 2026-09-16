import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, formatDate, formatTime, formatDuration, canResolveStop, canAccess } from '../store'
import type { Machine } from '../store'

type Tab = 'panel' | 'registro' | 'historial' | 'catalogo'

export default function MaquinasPage() {
  const { machines, setMachines, events, setEvents, currentUser, users, ticker: _ticker, lists } = useStore()
  const canViewMachineCatalog = canAccess(currentUser, users, 'add.catalog')
  const canCreateMachine = canViewMachineCatalog
  const canEditMachine = canViewMachineCatalog
  const canDeleteMachine = canViewMachineCatalog
  const canManageCatalog = canViewMachineCatalog
  const canManageShift = canAccess(currentUser, users, 'machines.summary', 'shift')
  const [tab, setTab] = useState<Tab>('panel')
  const [searchParams] = useSearchParams()
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id ?? '')

  // ── Derived ──
  const activeEvents = events.filter(e => e.status === 'down')
  const machinesDown = new Set(activeEvents.map(e => e.machine)).size
  const machinesRunning = machines.length - machinesDown
  const downMachineNames = new Set(activeEvents.map(e => e.machine))
  const preventiveMachineNames = new Set(activeEvents.filter(e => e.description === 'Mantenimiento Preventivo').map(e => e.machine))
  const preventiveMachines = preventiveMachineNames.size
  const machinesStopped = machinesDown - preventiveMachines
  const orderedMachines = [...machines].sort((first, second) => {
    const firstEvent = activeEvents.find(event => event.machine === first.name)
    const secondEvent = activeEvents.find(event => event.machine === second.name)
    const firstPriority = !firstEvent ? 2 : firstEvent.description === 'Mantenimiento Preventivo' ? 1 : 0
    const secondPriority = !secondEvent ? 2 : secondEvent.description === 'Mantenimiento Preventivo' ? 1 : 0
    return firstPriority - secondPriority
  })
  const selectedMachine = machines.find(machine => machine.id === selectedMachineId) ?? machines[0]
  const selectedEvent = selectedMachine ? activeEvents.find(event => event.machine === selectedMachine.name) : undefined

  useEffect(() => {
    const requestedTab = searchParams.get('tab') as Tab | null
    if (!requestedTab) {
      setTab('panel')
      return
    }
    if (['panel', 'registro', 'historial', 'catalogo'].includes(requestedTab)) setTab(requestedTab)
  }, [searchParams])

  useEffect(() => {
    if (!machines.some(machine => machine.id === selectedMachineId)) setSelectedMachineId(machines[0]?.id ?? '')
  }, [machines, selectedMachineId])

  // ── Register stop ──
  const [newMachine, setNewMachine] = useState(machines[0]?.name ?? '')
  const [useCustom, setUseCustom] = useState(false)
  const [customMachine, setCustomMachine] = useState('')
  const [newDesc, setNewDesc] = useState<string>(lists.stopTypes[0] ?? '')
  const [shiftMessage, setShiftMessage] = useState('')

  const isEndOfShift = activeEvents.some(e => e.description === 'Fin Turno')

  function toggleShift() {
    if (!canManageShift) return
    if (isEndOfShift) {
      setEvents(prev => prev.map(event => event.status === 'down' && event.description === 'Fin Turno'
        ? { ...event, endTime: new Date(), solution: 'Inicio de turno', status: 'running', resolvedBy: currentUser }
        : event))
      setShiftMessage('Inicio de turno registrado. Se levantaron los paros de Fin Turno.')
      return
    }

    const activeMachineNames = new Set(activeEvents.map(event => event.machine))
    const shiftStops = machines
      .filter(machine => !activeMachineNames.has(machine.name))
      .map(machine => ({
        id: `${Date.now()}-${machine.id}`,
        machine: machine.name,
        description: 'Fin Turno',
        startTime: new Date(),
        endTime: null,
        solution: null,
        status: 'down' as const,
        reportedBy: currentUser,
        resolvedBy: null,
      }))

    if (shiftStops.length === 0) {
      setShiftMessage('No hay máquinas disponibles para poner en Fin de Turno.')
      return
    }

    setEvents(prev => [...shiftStops, ...prev])
    setShiftMessage(`Fin de turno registrado para ${shiftStops.length} ${shiftStops.length === 1 ? 'máquina' : 'máquinas'}.`)
  }

  function registerStop() {
    const machine = useCustom ? customMachine.trim().toUpperCase() : newMachine
    if (!machine || !newDesc.trim()) return
    setEvents(prev => [{
      id: Date.now().toString(), machine, description: newDesc.trim(),
      startTime: new Date(), endTime: null, solution: null,
      status: 'down', reportedBy: currentUser, resolvedBy: null,
    }, ...prev])
    setNewDesc(lists.stopTypes[0] ?? ''); setCustomMachine(''); setTab('panel')
  }

  // ── Resolve stop ──
  const [solutionModal, setSolutionModal] = useState<string | null>(null)
  const [solutionText, setSolutionText] = useState('')
  const [permissionMessage, setPermissionMessage] = useState('')

  useEffect(() => {
    if (!permissionMessage) return
    const timeoutId = window.setTimeout(() => setPermissionMessage(''), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [permissionMessage])

  useEffect(() => {
    if (!shiftMessage) return
    const timeoutId = window.setTimeout(() => setShiftMessage(''), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [shiftMessage])

  function requestResolve(event: { id: string; reportedBy: string }) {
    if (!canResolveStop(event, currentUser, users)) {
      setPermissionMessage('No puedes levantar este paro. Solo puede hacerlo quien lo registró o el admin.')
      return
    }
    setPermissionMessage('')
    setSolutionModal(event.id)
    setSolutionText('')
  }

  function resolveStop() {
    const event = events.find(e => e.id === solutionModal)
    if (!solutionModal || !event || !canResolveStop(event, currentUser, users) || !solutionText.trim()) return
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
  const [form, setForm] = useState({ type: '', number: '', area: '', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  function openNew() {
    if (!canCreateMachine && !canEditMachine) return
    setEditingId(null); setForm({ type: '', number: '', area: '', notes: '' }); setFormError('')
  }
  function openEdit(m: Machine) {
    if (!canEditMachine) return
    setEditingId(m.id); setForm({ type: m.type, number: m.number, area: m.area, notes: m.notes }); setFormError('')
  }
  function saveMachine() {
    if (editingId ? !canEditMachine : !canCreateMachine) return
    const type = form.type.trim().toUpperCase()
    const number = form.number.trim().padStart(2, '0')
    const name = `${type}-${number}`
    if (!type) { setFormError('El tipo de máquina es requerido.'); return }
    if (!form.number.trim() || !/^\d+$/.test(form.number.trim())) { setFormError('El número de máquina debe ser numérico.'); return }
    if (!form.area) { setFormError('El área es requerida.'); return }
    if (machines.some(m => m.name === name && m.id !== editingId)) { setFormError('Ya existe una máquina con ese nombre.'); return }
    if (editingId) {
      setMachines(prev => prev.map(m => m.id === editingId ? { ...m, name, type, number, area: form.area, notes: form.notes.trim() } : m))
    } else {
      setMachines(prev => [...prev, { id: Date.now().toString(), name, type, number, area: form.area, notes: form.notes.trim() }])
    }
    openNew()
  }
  function removeMachine(id: string) {
    if (!canDeleteMachine) return
    setMachines(prev => prev.filter(m => m.id !== id))
    setDeleteConfirm(null)
    if (editingId === id) openNew()
  }

  return (
    <div>
      {permissionMessage && <div className="mb-6 border border-[#FFB800]/40 bg-[#FFB800]/5 px-4 py-3 text-sm text-[#FFB800]">{permissionMessage}</div>}

      {/* ── PANEL ── */}
      {tab === 'panel' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#292929] bg-[#0d0d0d] px-4 py-3">
            <div className="flex items-center gap-5 text-xs uppercase tracking-wider">
              <span className="text-white">Estado de máquinas</span>
              <span className="text-[#00E87A]">Disponibles: {machinesRunning}</span>
              <span className="text-[#FF2D00]">En paro: {machinesStopped}</span>
              <span className="text-[#FFB800]">Preventivo: {preventiveMachines}</span>
            </div>
            {canManageShift && <button onClick={toggleShift} className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold border transition-colors cursor-pointer ${isEndOfShift ? 'border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black' : 'border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800] hover:text-black'}`}>
              {isEndOfShift ? 'Iniciar turno' : 'Finalizar turno'}
            </button>}
          </div>
          {shiftMessage && <div className="border border-[#FFB800]/40 bg-[#FFB800]/5 px-4 py-3 text-xs text-[#FFB800]">{shiftMessage}</div>}

          <div className="border border-[#292929] bg-[#0b0b0b] overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-[#151515] text-[10px] uppercase tracking-[0.15em] text-[#666]">
                <tr>
                  <th className="px-4 py-3 font-medium">Máquina</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Tiempo de paro</th>
                  <th className="px-4 py-3 font-medium">Inicio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {orderedMachines.map(machine => {
                  const event = activeEvents.find(item => item.machine === machine.name)
                  const isPreventive = event?.description === 'Mantenimiento Preventivo'
                  const status = event ? (isPreventive ? 'PREVENTIVO' : 'EN PARO') : 'PRODUCCIÓN'
                  return (
                    <tr key={machine.id} onClick={() => setSelectedMachineId(machine.id)} className={`cursor-pointer transition-colors ${selectedMachine?.id === machine.id ? 'bg-[#191919]' : 'hover:bg-[#141414]'}`}>
                      <td className="px-4 py-3 font-bold text-white">{machine.name}</td>
                      <td className="px-4 py-3 text-[#888]">{machine.area || '—'}</td>
                      <td className={`px-4 py-3 font-bold ${isPreventive ? 'text-[#FFB800]' : event ? 'text-[#FF4A2F]' : 'text-[#00E87A]'}`}><span className="mr-2">●</span>{status}</td>
                      <td className={`px-4 py-3 font-mono ${event ? 'text-[#FF6B50]' : 'text-[#555]'}`}>{event ? formatDuration(event.startTime, null) : '--'}</td>
                      <td className="px-4 py-3 text-[#777]">{event ? formatTime(event.startTime) : '--'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selectedMachine && (
            <section className="border border-[#292929] bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-[#292929] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.15em] text-[#666]">Detalle de máquina</div>
                <div className="text-sm font-bold text-white">{selectedMachine.name}</div>
              </div>
              <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
                <div className="border-b md:border-r border-[#222] px-4 py-4"><div className="detail-label">Estado actual</div><div className={`mt-2 text-sm font-bold ${selectedEvent ? 'text-[#FF4A2F]' : 'text-[#00E87A]'}`}>{selectedEvent ? (selectedEvent.description === 'Mantenimiento Preventivo' ? 'PREVENTIVO' : 'EN PARO') : 'PRODUCCIÓN'}</div></div>
                <div className="border-b lg:border-r border-[#222] px-4 py-4"><div className="detail-label">Inicio del paro</div><div className="mt-2 text-sm text-[#bbb]">{selectedEvent ? `${formatDate(selectedEvent.startTime)} ${formatTime(selectedEvent.startTime)}` : '—'}</div></div>
                <div className="border-b md:border-r lg:border-b-0 border-[#222] px-4 py-4"><div className="detail-label">Tiempo transcurrido</div><div className="mt-2 text-sm font-mono text-[#FFB800]">{selectedEvent ? formatDuration(selectedEvent.startTime, null) : '—'}</div></div>
                <div className="px-4 py-4"><div className="detail-label">Área</div><div className="mt-2 text-sm text-[#bbb]">{selectedMachine.area || '—'}</div></div>
              </div>
              {selectedEvent && <div className="border-t border-[#222] px-4 py-4"><div className="detail-label">Motivo del paro</div><div className="mt-2 text-sm text-[#bbb]">{selectedEvent.description}</div><div className="mt-1 text-xs text-[#666]">Registrado por: {selectedEvent.reportedBy}</div></div>}
              <div className="flex flex-wrap gap-2 border-t border-[#222] px-4 py-3">
                <button onClick={() => { setNewMachine(selectedMachine.name); setTab('registro') }} className="px-3 py-2 text-[11px] uppercase tracking-wider font-bold border border-[#FF2D00] text-[#FF4A2F] hover:bg-[#FF2D00] hover:text-white cursor-pointer">Registrar paro</button>
                {selectedEvent && <button onClick={() => requestResolve(selectedEvent)} className="px-3 py-2 text-[11px] uppercase tracking-wider font-bold border border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black cursor-pointer">Finalizar paro</button>}
              </div>
            </section>
          )}
        </div>
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
            <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">Tipo de paro</label>
            <select value={newDesc} onChange={e => setNewDesc(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors">
              {lists.stopTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
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
                  {ev.solution && <div>
                    <div className="text-xs text-[#00E87A]/60 uppercase tracking-wider mb-1">Solución</div>
                    <p className="text-sm text-[#bbb] leading-relaxed">{ev.solution}</p>
                  </div>}
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
          {canManageCatalog && <div className="md:col-span-2">
            <div className="border border-[#222] p-5 sticky top-6">
              <div className="text-xs text-[#555] uppercase tracking-widest mb-1">{editingId ? 'Editando' : 'Nueva máquina'}</div>
              <h3 className="text-lg font-bold text-white mb-5">{editingId ? machines.find(m => m.id === editingId)?.name : 'Agregar'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Tipo de máquina <span className="text-[#FF2D00]">*</span></label>
                  <select value={form.type} onChange={e => { setForm(f => ({ ...f, type: e.target.value })); setFormError('') }}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white transition-colors">
                    <option value="">Selecciona un tipo</option>
                    {lists.machineTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Número de máquina <span className="text-[#FF2D00]">*</span></label>
                  <input type="number" min="1" step="1" placeholder="Ej: 03" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Área <span className="text-[#FF2D00]">*</span></label>
                  <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white transition-colors">
                    <option value="">Selecciona un área</option>
                    {lists.areas.map(area => <option key={area} value={area}>{area}</option>)}
                  </select>
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
          </div>}

          <div className={canManageCatalog ? 'md:col-span-3' : 'md:col-span-5'}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs text-[#444]">{machines.length} registros</div>
                {!canManageCatalog && <div className="text-xs text-[#FFB800] mt-2">No tienes permisos para modificar el catálogo.</div>}
              </div>
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
                      {canManageCatalog && <div className="flex gap-1 shrink-0">
                        {canEditMachine && <button onClick={() => isEditing ? openNew() : openEdit(m)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-white hover:border-white transition-all cursor-pointer">{isEditing ? 'Esc' : 'Editar'}</button>}
                        {canDeleteMachine && <button onClick={() => setDeleteConfirm(m.id)} disabled={isDown} title={isDown ? 'Máquina en paro activo' : ''} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">Eliminar</button>}
                      </div>}
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
