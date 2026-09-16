import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, canResolveStop, formatDate, formatDuration, formatTime } from '../store'
import type { Machine, StopEvent } from '../store'

const DEMO_YESTERDAY_AVAILABILITY = 87.5
const DEMO_TARGET_AVAILABILITY = 95
const CHART_HOURS = ['06', '08', '10', '12', '14', '16', '18', '20']

function SectionTitle({ children, meta }: { children: React.ReactNode; meta?: string }) {
  return <div className="flex items-center gap-3 mb-3"><h2 className="text-xs uppercase tracking-[0.18em] text-[#777] font-semibold">{children}</h2><div className="flex-1 h-px bg-[#202020]" />{meta && <span className="text-[10px] uppercase tracking-wider text-[#555]">{meta}</span>}</div>
}

function KpiCard({ label, value, detail, color, note }: { label: string; value: string; detail: string; color: string; note?: string }) {
  return <div className="border border-[#252525] bg-[#0b0b0b] p-4 min-h-29.5 flex flex-col justify-between" style={{ borderTopColor: color }}>
    <div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-[0.16em]" style={{ color }}>● {label}</span>{note && <span className="text-[10px] text-[#666]">{note}</span>}</div>
    <div className="flex items-end justify-between gap-3"><div className="text-4xl font-extrabold leading-none tabular-nums text-white">{value}</div><span className="text-[10px] text-[#666] text-right uppercase tracking-wider">{detail}</span></div>
  </div>
}

function MachineCard({ machine, event, selected, onSelect }: { machine: Machine; event?: StopEvent; selected: boolean; onSelect: () => void }) {
  const isPreventive = event?.description === 'Mantenimiento Preventivo'
  const isDown = Boolean(event)
  const status = isPreventive ? 'PREVENTIVO' : isDown ? 'EN PARO' : 'PRODUCCIÓN'
  const stateColor = isPreventive ? '#FFB800' : isDown ? '#FF2D00' : '#00E87A'
  return <button onClick={onSelect} className={`text-left border p-3 min-h-28 transition-colors cursor-pointer ${selected ? 'border-white bg-[#191919]' : 'border-[#252525] bg-[#0b0b0b] hover:border-[#555]'}`}>
    <div className="flex items-center justify-between gap-2 border-b border-[#202020] pb-2"><span className="text-xs font-bold text-white truncate"><span className="mr-2" style={{ color: stateColor }}>●</span>{machine.name}</span><span className="text-[9px] uppercase tracking-wider shrink-0" style={{ color: stateColor }}>{status}</span></div>
    <div className="mt-2 space-y-1 text-[10px] text-[#666] uppercase tracking-wider">
      {event ? <><div>Causa: <span className="text-[#aaa] normal-case tracking-normal">{event.description}</span></div><div>Duración: <span className="text-[#FF6B50] font-mono normal-case tracking-normal">{formatDuration(event.startTime, null)}</span></div></> : <><div>Estado: <span className="text-[#00E87A]">Operativa</span></div><div>Disponibilidad: <span className="text-[#888]">N/D</span></div></>}
    </div>
  </button>
}

export default function DashboardPage() {
  const { machines, events, currentUser, users, ticker: _ticker } = useStore()
  const navigate = useNavigate()
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null)
  const activeEvents = events.filter(event => event.status === 'down')
  const eventByMachine = new Map(activeEvents.map(event => [event.machine, event]))
  const preventiveMachines = activeEvents.filter(event => event.description === 'Mantenimiento Preventivo').length
  const stoppedMachines = activeEvents.length - preventiveMachines
  const productionMachines = Math.max(0, machines.length - new Set(activeEvents.map(event => event.machine)).size)
  const availability = machines.length ? (productionMachines / machines.length) * 100 : 0
  const selectedMachine = machines.find(machine => machine.id === selectedMachineId)
  const selectedEvent = selectedMachine ? eventByMachine.get(selectedMachine.name) : undefined
  const latestEvents = [...events].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 6)
  const chartValues = CHART_HOURS.map(hour => events.filter(event => event.startTime.getHours() === Number(hour)).length)
  const maxChartValue = Math.max(1, ...chartValues)
  const canManageSelected = selectedEvent ? canResolveStop(selectedEvent, currentUser, users) : false
  const orderedMachines = [...machines].sort((a, b) => {
    const priority = (machine: Machine) => { const event = eventByMachine.get(machine.name); return !event ? 2 : event.description === 'Mantenimiento Preventivo' ? 1 : 0 }
    return priority(a) - priority(b)
  })

  return <div className="space-y-5">
    <div className="flex items-end justify-between gap-4 border-b border-[#202020] pb-3"><div><div className="text-[10px] uppercase tracking-[0.2em] text-[#555]">Supervisión operativa</div><h2 className="text-lg font-bold text-white mt-1">Resumen de planta</h2></div><span className="text-[10px] uppercase tracking-wider text-[#555]">Datos en tiempo real</span></div>

    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard label="Producción" value={`${productionMachines}/${machines.length}`} detail="máquinas activas" color="#00E87A" note="↑ estable" />
      <KpiCard label="En paro" value={String(stoppedMachines)} detail={activeEvents[0] ? formatDuration(activeEvents[0].startTime, null) : 'sin paros'} color="#FF2D00" />
      <KpiCard label="Preventivo" value={String(preventiveMachines)} detail="máquinas" color="#FFB800" note="programado" />
      <KpiCard label="Disponibilidad" value={`${availability.toFixed(1)}%`} detail="actual" color="#888" note="demo" />
    </section>

    <section className="border border-[#252525] bg-[#0b0b0b] p-4">
      <SectionTitle meta="referencia demo">Disponibilidad de planta</SectionTitle>
      <div className="flex items-end justify-between gap-4"><div className="text-3xl font-extrabold text-white tabular-nums">{availability.toFixed(1)}%</div><div className="text-[10px] text-[#666] uppercase tracking-wider">Meta: {DEMO_TARGET_AVAILABILITY}% <span className="text-[#555]">(demo)</span></div></div>
      <div className="h-2 bg-[#151515] border border-[#292929] mt-3"><div className="h-full bg-[#00E87A] transition-all duration-700" style={{ width: `${Math.min(100, availability)}%` }} /></div>
      <div className="flex flex-wrap justify-between gap-2 mt-2 text-[10px] uppercase tracking-wider text-[#666]"><span>Hoy: <b className="text-[#aaa]">{availability.toFixed(1)}%</b></span><span>Ayer: <b className="text-[#888]">{DEMO_YESTERDAY_AVAILABILITY}%</b> <span className="text-[#555]">(demo)</span></span><span>Diferencia: <b className={availability >= DEMO_YESTERDAY_AVAILABILITY ? 'text-[#00E87A]' : 'text-[#FF2D00]'}>{(availability - DEMO_YESTERDAY_AVAILABILITY).toFixed(1)} pp</b></span></div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)] gap-5">
      <section><SectionTitle meta={`${machines.length} máquinas`}>Estado de planta</SectionTitle><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{orderedMachines.map(machine => <MachineCard key={machine.id} machine={machine} event={eventByMachine.get(machine.name)} selected={selectedMachineId === machine.id} onSelect={() => setSelectedMachineId(machine.id)} />)}</div></section>
      <section className="border border-[#252525] bg-[#0b0b0b] p-4"><SectionTitle meta={String(activeEvents.length)}>Paros activos</SectionTitle>{activeEvents.length === 0 ? <div className="py-10 text-center text-xs uppercase tracking-wider text-[#00E87A]">✓ No hay máquinas detenidas</div> : <div className="space-y-3">{activeEvents.map(event => <button key={event.id} onClick={() => setSelectedMachineId(machines.find(machine => machine.name === event.machine)?.id ?? null)} className="w-full text-left border border-[#FF2D00]/35 bg-[#FF2D00]/5 p-3 cursor-pointer hover:border-[#FF2D00]/70"><div className="flex justify-between gap-2"><span className="text-xs font-bold text-white"><span className="text-[#FF2D00] mr-2">●</span>{event.machine}</span><span className="text-[9px] text-[#FF6B50] uppercase">En atención</span></div><div className="text-xs text-[#aaa] mt-2">{event.description}</div><div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-[#666] uppercase"><span>Desde: <b className="text-[#888]">{formatTime(event.startTime)}</b></span><span>Duración: <b className="text-[#FF6B50]">{formatDuration(event.startTime, null)}</b></span><span className="col-span-2">Reportó: <b className="text-[#888] normal-case">{event.reportedBy}</b></span></div><div className="mt-2 text-[9px] uppercase tracking-widest text-[#FF6B50]">Ver detalle →</div></button>)}</div>}</section>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <section className="border border-[#252525] bg-[#0b0b0b] p-4"><SectionTitle>Paros durante el día</SectionTitle><div className="flex items-end gap-2 h-36 border-b border-l border-[#333] px-3 pb-0 pt-4">{chartValues.map((value, index) => <div key={CHART_HOURS[index]} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><div className="w-full max-w-8 bg-[#FF2D00]/70 hover:bg-[#FF2D00] transition-colors" style={{ height: `${Math.max(value ? 10 : 2, (value / maxChartValue) * 100)}%` }} title={`${value} eventos`} /><span className="text-[9px] text-[#555]">{CHART_HOURS[index]}h</span></div>)}</div><div className="text-[9px] uppercase tracking-wider text-[#555] mt-2">Eventos iniciados por hora · datos derivados del registro actual</div></section>
      <section className="border border-[#252525] bg-[#0b0b0b] p-4"><SectionTitle>Últimos eventos</SectionTitle><div className="divide-y divide-[#202020]">{latestEvents.map(event => <div key={event.id} className="grid grid-cols-[42px_100px_1fr] gap-2 py-2 text-[10px]"><span className="text-[#666] font-mono">{formatTime(event.startTime).slice(0, 5)}</span><span className="text-white font-bold truncate">{event.machine}</span><span className="text-[#888] truncate">{event.description}</span></div>)}</div>{latestEvents.length === 0 && <div className="py-8 text-center text-xs text-[#555]">Sin eventos registrados</div>}</section>
    </div>

    {selectedMachine && <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget) setSelectedMachineId(null) }}><aside className="w-full max-w-lg border border-[#444] bg-[#0d0d0d] p-5 max-h-[90vh] overflow-y-auto"><div className="flex items-start justify-between gap-3 border-b border-[#292929] pb-4"><div><div className="text-[10px] uppercase tracking-widest text-[#666]">Detalle de máquina</div><h3 className="text-xl font-bold text-white mt-1">{selectedMachine.name}</h3></div><button onClick={() => setSelectedMachineId(null)} className="text-[#777] hover:text-white text-lg cursor-pointer" aria-label="Cerrar detalle">×</button></div><div className="grid grid-cols-2 gap-4 py-5 text-xs"><div><div className="detail-label">Estado</div><div className="mt-2 font-bold" style={{ color: selectedEvent ? selectedEvent.description === 'Mantenimiento Preventivo' ? '#FFB800' : '#FF2D00' : '#00E87A' }}>{selectedEvent ? selectedEvent.description === 'Mantenimiento Preventivo' ? 'PREVENTIVO' : 'EN PARO' : 'PRODUCCIÓN'}</div></div><div><div className="detail-label">Último cambio</div><div className="mt-2 text-[#bbb]">{selectedEvent ? `${formatDate(selectedEvent.startTime)} ${formatTime(selectedEvent.startTime)}` : 'N/D'}</div></div>{selectedEvent && <><div><div className="detail-label">Duración</div><div className="mt-2 text-[#FF6B50] font-mono">{formatDuration(selectedEvent.startTime, null)}</div></div><div><div className="detail-label">Reportado por</div><div className="mt-2 text-[#bbb]">{selectedEvent.reportedBy}</div></div><div className="col-span-2"><div className="detail-label">Causa</div><div className="mt-2 text-[#bbb]">{selectedEvent.description}</div></div></>}</div><div className="border-t border-[#292929] pt-4"><div className="detail-label mb-2">Historial reciente</div>{events.filter(event => event.machine === selectedMachine.name).slice(0, 4).map(event => <div key={event.id} className="flex gap-3 py-2 border-b border-[#202020] text-[10px]"><span className="text-[#666]">{formatDate(event.startTime)}</span><span className="text-[#aaa]">{event.description}</span></div>)}</div><div className="flex gap-2 pt-4">{selectedEvent && canManageSelected && <button onClick={() => navigate('/maquinas?tab=registro')} className="flex-1 border border-[#00E87A] text-[#00E87A] py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#00E87A] hover:text-black cursor-pointer">Gestionar paro</button>}{!selectedEvent && <button onClick={() => navigate('/maquinas?tab=registro')} className="flex-1 border border-[#FF2D00] text-[#FF6B50] py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#FF2D00] hover:text-white cursor-pointer">Registrar paro</button>}<button onClick={() => setSelectedMachineId(null)} className="border border-[#333] text-[#777] px-4 py-2 text-[10px] uppercase tracking-wider cursor-pointer">Cerrar</button></div></aside></div>}
  </div>
}
