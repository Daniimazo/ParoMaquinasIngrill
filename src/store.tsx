import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type MachineStatus = 'down' | 'running'

export interface StopEvent {
  id: string
  machine: string
  description: string
  startTime: Date
  endTime: Date | null
  solution: string | null
  status: MachineStatus
  reportedBy: string
  resolvedBy: string | null
}

export interface Machine {
  id: string
  name: string
  area: string
  notes: string
}

export type ToolStatus = 'stored' | 'in_use' | 'maintenance' | 'damaged'

export interface Tool {
  id: string
  name: string
  category: string
  serial: string
  notes: string
  status: ToolStatus
  statusNote: string
  statusChangedAt: Date
}

export interface ToolLog {
  id: string
  toolId: string
  toolName: string
  from: ToolStatus
  to: ToolStatus
  note: string
  at: Date
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  stored: 'Guardada',
  in_use: 'En Uso',
  maintenance: 'Mantenimiento',
  damaged: 'Dañada',
}

export const TOOL_STATUS_COLOR: Record<ToolStatus, string> = {
  stored: '#4488FF',
  in_use: '#00E87A',
  maintenance: '#FFB800',
  damaged: '#FF2D00',
}

export const TOOL_STATUS_BG: Record<ToolStatus, string> = {
  stored: 'rgba(68,136,255,0.08)',
  in_use: 'rgba(0,232,122,0.08)',
  maintenance: 'rgba(255,184,0,0.08)',
  damaged: 'rgba(255,45,0,0.08)',
}

const INITIAL_MACHINES: Machine[] = [
  { id: 'm1', name: 'TORNO-01', area: 'Maquinado', notes: '' },
  { id: 'm2', name: 'TORNO-02', area: 'Maquinado', notes: '' },
  { id: 'm3', name: 'FRESADORA-01', area: 'Maquinado', notes: '' },
  { id: 'm4', name: 'FRESADORA-02', area: 'Maquinado', notes: '' },
  { id: 'm5', name: 'PRENSA-01', area: 'Prensado', notes: '' },
  { id: 'm6', name: 'PRENSA-02', area: 'Prensado', notes: '' },
  { id: 'm7', name: 'SOLDADORA-01', area: 'Soldadura', notes: '' },
  { id: 'm8', name: 'CNC-01', area: 'CNC', notes: '' },
  { id: 'm9', name: 'CNC-02', area: 'CNC', notes: '' },
  { id: 'm10', name: 'COMPRESOR-01', area: 'Servicios', notes: '' },
]

const INITIAL_TOOLS: Tool[] = [
  { id: 't1', name: 'Taladro Percutor', category: 'Taladros', serial: 'BOC-2241', notes: 'Bosch GSB 550', status: 'stored', statusNote: '', statusChangedAt: new Date(Date.now() - 3600000 * 8) },
  { id: 't2', name: 'Taladro de Banco', category: 'Taladros', serial: 'WKS-0091', notes: 'Wolfcraft 4110', status: 'in_use', statusNote: 'En uso por operador Martínez, área CNC', statusChangedAt: new Date(Date.now() - 3600000 * 1.5) },
  { id: 't3', name: 'Lijadora Orbital', category: 'Lijadoras', serial: 'DWT-5512', notes: 'DeWalt DWE6423', status: 'maintenance', statusNote: 'Cambio de plato de lija y limpieza de motor', statusChangedAt: new Date(Date.now() - 3600000 * 3) },
  { id: 't4', name: 'Lijadora de Banda', category: 'Lijadoras', serial: 'MKT-3301', notes: 'Makita 9403', status: 'stored', statusNote: '', statusChangedAt: new Date(Date.now() - 3600000 * 24) },
  { id: 't5', name: 'Amoladora Angular 4.5"', category: 'Amoladoras', serial: 'BOC-8821', notes: 'Bosch GWS 700', status: 'in_use', statusNote: 'Rebabeo piezas prensa', statusChangedAt: new Date(Date.now() - 1800000) },
  { id: 't6', name: 'Amoladora Angular 7"', category: 'Amoladoras', serial: 'DWT-7701', notes: 'DeWalt DWE4557', status: 'damaged', statusNote: 'Disco de corte explotó, protección doblada. Requiere revisión técnica.', statusChangedAt: new Date(Date.now() - 3600000 * 5) },
  { id: 't7', name: 'Sierra Circular', category: 'Sierras', serial: 'SKL-1102', notes: 'Skilsaw SPT67WM', status: 'stored', statusNote: '', statusChangedAt: new Date(Date.now() - 3600000 * 12) },
  { id: 't8', name: 'Rotomartillo SDS', category: 'Taladros', serial: 'BOC-1190', notes: 'Bosch GBH 2-26', status: 'stored', statusNote: '', statusChangedAt: new Date(Date.now() - 3600000 * 30) },
]

const INITIAL_EVENTS: StopEvent[] = [
  { id: 'e1', machine: 'CNC-01', description: 'Falla en husillo principal, vibración excesiva detectada por operador.', startTime: new Date(Date.now() - 3600000 * 2.5), endTime: new Date(Date.now() - 3600000 * 1.2), solution: 'Cambio de baleros del husillo, ajuste de torque y prueba de corrida en vacío.', status: 'running', reportedBy: 'operador', resolvedBy: 'supervisor' },
  { id: 'e2', machine: 'PRENSA-01', description: 'Ruptura de punzón. Pieza atorada en troquel.', startTime: new Date(Date.now() - 3600000 * 0.8), endTime: null, solution: null, status: 'down', reportedBy: 'operador', resolvedBy: null },
  { id: 'e3', machine: 'SOLDADORA-01', description: 'Sin gas de protección. Proveedor no surtió cilindros a tiempo.', startTime: new Date(Date.now() - 3600000 * 5), endTime: new Date(Date.now() - 3600000 * 3), solution: 'Resurtido de cilindros de argón. Verificación de contrato con proveedor.', status: 'running', reportedBy: 'supervisor', resolvedBy: 'admin' },
]

const INITIAL_TOOL_LOGS: ToolLog[] = [
  { id: 'tl1', toolId: 't3', toolName: 'Lijadora Orbital', from: 'stored', to: 'maintenance', note: 'Cambio de plato de lija y limpieza de motor', at: new Date(Date.now() - 3600000 * 3) },
  { id: 'tl2', toolId: 't6', toolName: 'Amoladora Angular 7"', from: 'in_use', to: 'damaged', note: 'Disco de corte explotó, protección doblada. Requiere revisión técnica.', at: new Date(Date.now() - 3600000 * 5) },
  { id: 'tl3', toolId: 't2', toolName: 'Taladro de Banco', from: 'stored', to: 'in_use', note: 'En uso por operador Martínez, área CNC', at: new Date(Date.now() - 3600000 * 1.5) },
]

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

interface AppStore {
  // Auth
  isLoggedIn: boolean
  login: (user: string, pass: string) => boolean
  logout: () => void
  currentUser: string

  // Machines
  machines: Machine[]
  setMachines: React.Dispatch<React.SetStateAction<Machine[]>>
  events: StopEvent[]
  setEvents: React.Dispatch<React.SetStateAction<StopEvent[]>>

  // Tools
  tools: Tool[]
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>
  toolLogs: ToolLog[]
  setToolLogs: React.Dispatch<React.SetStateAction<ToolLog[]>>

  // Ticker for live updates
  ticker: number
}

const StoreContext = createContext<AppStore | null>(null)

const DEMO_USERS: Record<string, string> = {
  admin: 'admin123',
  supervisor: 'sup2024',
  operador: 'op1234',
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES)
  const [events, setEvents] = useState<StopEvent[]>(INITIAL_EVENTS)
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS)
  const [toolLogs, setToolLogs] = useState<ToolLog[]>(INITIAL_TOOL_LOGS)
  const [ticker, setTicker] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTicker(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  function login(user: string, pass: string): boolean {
    if (DEMO_USERS[user.toLowerCase()] === pass) {
      setIsLoggedIn(true)
      setCurrentUser(user.toLowerCase())
      return true
    }
    return false
  }

  function logout() {
    setIsLoggedIn(false)
    setCurrentUser('')
  }

  return (
    <StoreContext.Provider value={{ isLoggedIn, login, logout, currentUser, machines, setMachines, events, setEvents, tools, setTools, toolLogs, setToolLogs, ticker }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function formatDuration(start: Date, end: Date | null): string {
  const ms = (end ?? new Date()).getTime() - start.getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
