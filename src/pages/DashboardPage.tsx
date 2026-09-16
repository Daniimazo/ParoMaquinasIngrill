import { useStore } from '../store'

export default function DashboardPage() {
  const { machines, events, ticker: _ticker } = useStore()
  const activeEvents = events.filter(event => event.status === 'down')
  const machinesDown = new Set(activeEvents.map(event => event.machine)).size
  const preventiveMachineNames = new Set(activeEvents.filter(event => event.description === 'Mantenimiento Preventivo').map(event => event.machine))
  const preventiveMachines = preventiveMachineNames.size
  const machinesStopped = machinesDown - preventiveMachines
  const machinesRunning = machines.length - machinesDown
  const downMachineNames = new Set(activeEvents.map(event => event.machine))

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <div className="border border-[#FF2D00] p-6 relative overflow-hidden">
          {machinesStopped > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-[#FF2D00] pulse-red m-3" />}
          <div className="text-xs text-[#FF2D00] uppercase tracking-widest mb-2">{machinesStopped > 0 ? '● EN PARO' : '○ EN PARO'}</div>
          <div className="text-6xl sm:text-7xl font-extrabold text-[#FF2D00] leading-none tabular-nums">{machinesStopped}</div>
          <div className="text-xs text-[#555] mt-3 uppercase tracking-wider">{machinesStopped === 1 ? 'máquina detenida' : 'máquinas detenidas'}</div>
        </div>
        <div className="border border-[#FFB800] p-6 relative overflow-hidden">
          {preventiveMachines > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-[#FFB800] m-3" />}
          <div className="text-xs text-[#FFB800] uppercase tracking-widest mb-2">{preventiveMachines > 0 ? '● PREVENTIVO' : '○ PREVENTIVO'}</div>
          <div className="text-6xl sm:text-7xl font-extrabold text-[#FFB800] leading-none tabular-nums">{preventiveMachines}</div>
          <div className="text-xs text-[#555] mt-3 uppercase tracking-wider">{preventiveMachines === 1 ? 'máquina en preventivo' : 'máquinas en preventivo'}</div>
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
        <div className="flex flex-wrap gap-4 mb-3 text-[10px] uppercase tracking-wider text-[#666]">
          <span className="text-[#00E87A]">● En producción</span>
          <span className="text-[#FFB800]">● Paro preventivo</span>
          <span className="text-[#FF2D00]">● Paro</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {machines.map(machine => {
            const isDown = downMachineNames.has(machine.name)
            const isPreventive = preventiveMachineNames.has(machine.name)
            return <div key={machine.id} className={`p-3 border text-center text-xs font-bold tracking-wider transition-all ${isPreventive ? 'border-[#FFB800]/60 bg-[#FFB800]/10 text-[#FFD166]' : isDown ? 'border-[#FF2D00]/60 bg-[#FF2D00]/10 text-[#FF6B50]' : 'border-[#1a1a1a] bg-[#0d0d0d] text-[#00E87A]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1.5 ${isPreventive ? 'bg-[#FFB800]' : isDown ? 'bg-[#FF2D00] pulse-red' : 'bg-[#00E87A]'}`} />
              {machine.name}
            </div>
          })}
        </div>
      </div>
    </div>
  )
}
