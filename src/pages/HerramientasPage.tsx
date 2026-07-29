import { useState } from 'react'
import { useStore, TOOL_STATUS_LABEL, TOOL_STATUS_COLOR, TOOL_STATUS_BG, formatDate, formatTime } from '../store'
import type { Tool, ToolStatus } from '../store'

function ToolBadge({ status }: { status: ToolStatus }) {
  return (
    <span className="text-xs px-2 py-0.5 font-bold tracking-wider uppercase border"
      style={{ color: TOOL_STATUS_COLOR[status], borderColor: `${TOOL_STATUS_COLOR[status]}40`, background: TOOL_STATUS_BG[status] }}>
      ● {TOOL_STATUS_LABEL[status]}
    </span>
  )
}

export default function HerramientasPage() {
  const { tools, setTools, toolLogs, setToolLogs } = useStore()

  type Subview = 'panel' | 'catalogo' | 'bitacora'
  const [subview, setSubview] = useState<Subview>('panel')

  // Status modal
  const [statusModal, setStatusModal] = useState<Tool | null>(null)
  const [newStatus, setNewStatus] = useState<ToolStatus>('stored')
  const [statusNote, setStatusNote] = useState('')

  // CRUD
  const [form, setForm] = useState({ name: '', category: '', serial: '', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  // Log filter
  const [logFilter, setLogFilter] = useState('ALL')

  const toolCounts = { stored: 0, in_use: 0, maintenance: 0, damaged: 0 } as Record<ToolStatus, number>
  tools.forEach(t => toolCounts[t.status]++)

  const filteredLogs = [...toolLogs]
    .filter(l => logFilter === 'ALL' || l.toolName === logFilter)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
  const logNames = [...new Set(toolLogs.map(l => l.toolName))].sort()

  function openStatusModal(t: Tool) { setStatusModal(t); setNewStatus(t.status); setStatusNote('') }
  function applyStatus() {
    if (!statusModal) return
    const prev = statusModal.status
    setTools(ts => ts.map(t => t.id === statusModal.id ? { ...t, status: newStatus, statusNote: statusNote.trim(), statusChangedAt: new Date() } : t))
    if (prev !== newStatus) {
      setToolLogs(ls => [{ id: Date.now().toString(), toolId: statusModal.id, toolName: statusModal.name, from: prev, to: newStatus, note: statusNote.trim(), at: new Date() }, ...ls])
    }
    setStatusModal(null)
  }

  function openNew() { setEditingId(null); setForm({ name: '', category: '', serial: '', notes: '' }); setFormError('') }
  function openEdit(t: Tool) { setEditingId(t.id); setForm({ name: t.name, category: t.category, serial: t.serial, notes: t.notes }); setFormError('') }
  function save() {
    const name = form.name.trim()
    if (!name) { setFormError('El nombre es requerido.'); return }
    if (tools.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingId)) { setFormError('Ya existe una herramienta con ese nombre.'); return }
    if (editingId) {
      setTools(prev => prev.map(t => t.id === editingId ? { ...t, name, category: form.category.trim(), serial: form.serial.trim(), notes: form.notes.trim() } : t))
    } else {
      setTools(prev => [...prev, { id: Date.now().toString(), name, category: form.category.trim(), serial: form.serial.trim(), notes: form.notes.trim(), status: 'stored', statusNote: '', statusChangedAt: new Date() }])
    }
    openNew()
  }
  function remove(id: string) {
    setTools(prev => prev.filter(t => t.id !== id))
    setDeleteConfirm(null)
    if (editingId === id) openNew()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Control de</div>
          <h1 className="text-3xl font-extrabold text-white">Herramientas Eléctricas</h1>
        </div>
        <div className="flex gap-1">
          {(['panel', 'catalogo', 'bitacora'] as Subview[]).map(s => (
            <button key={s} onClick={() => setSubview(s)}
              className={`px-3 py-2 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${subview === s ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>
              {s === 'panel' ? 'Panel' : s === 'catalogo' ? 'Catálogo' : 'Bitácora'}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL ── */}
      {subview === 'panel' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['stored', 'in_use', 'maintenance', 'damaged'] as ToolStatus[]).map(s => (
              <div key={s} className="border p-5" style={{ borderColor: `${TOOL_STATUS_COLOR[s]}30`, background: TOOL_STATUS_BG[s] }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: TOOL_STATUS_COLOR[s] }}>● {TOOL_STATUS_LABEL[s]}</div>
                <div className="text-5xl font-extrabold leading-none tabular-nums" style={{ color: TOOL_STATUS_COLOR[s] }}>{toolCounts[s]}</div>
                <div className="text-xs text-[#555] mt-2">{toolCounts[s] === 1 ? 'herramienta' : 'herramientas'}</div>
              </div>
            ))}
          </div>

          {(toolCounts.damaged > 0 || toolCounts.maintenance > 0) && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xs uppercase tracking-widest text-[#FFB800] font-semibold">Requieren atención</div>
                <div className="flex-1 h-px bg-[#FFB800]/20" />
              </div>
              <div className="space-y-2">
                {tools.filter(t => t.status === 'damaged' || t.status === 'maintenance').map(t => (
                  <div key={t.id} className="border p-4 flex items-center justify-between gap-4"
                    style={{ borderColor: `${TOOL_STATUS_COLOR[t.status]}40`, background: TOOL_STATUS_BG[t.status] }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{t.name}</span>
                        {t.category && <span className="text-xs text-[#555] border border-[#222] px-2 py-0.5">{t.category}</span>}
                        <ToolBadge status={t.status} />
                      </div>
                      {t.statusNote && <p className="text-xs text-[#888] mt-1 truncate">{t.statusNote}</p>}
                      <p className="text-xs text-[#444] mt-0.5">Desde: {formatDate(t.statusChangedAt)} {formatTime(t.statusChangedAt)}</p>
                    </div>
                    <button onClick={() => openStatusModal(t)}
                      className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest font-bold border border-[#00E87A] text-[#00E87A] hover:bg-[#00E87A] hover:text-black transition-all cursor-pointer">
                      Cambiar estado
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xs uppercase tracking-widest text-[#555] font-semibold">Todas las herramientas</div>
              <div className="flex-1 h-px bg-[#1a1a1a]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map(t => (
                <div key={t.id} className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#2a2a2a] transition-all" style={{ borderLeftColor: TOOL_STATUS_COLOR[t.status], borderLeftWidth: 2 }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{t.name}</div>
                      {t.category && <div className="text-xs text-[#555]">{t.category}</div>}
                    </div>
                    <ToolBadge status={t.status} />
                  </div>
                  {t.serial && <div className="text-xs text-[#444] mb-2">S/N: <span className="text-[#666]">{t.serial}</span></div>}
                  {t.statusNote && <p className="text-xs text-[#666] mb-3 line-clamp-2">{t.statusNote}</p>}
                  <button onClick={() => openStatusModal(t)}
                    className="w-full py-1.5 text-xs uppercase tracking-widest font-semibold border border-[#222] text-[#555] hover:text-white hover:border-[#555] transition-all cursor-pointer">
                    Cambiar estado
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CATÁLOGO ── */}
      {subview === 'catalogo' && (
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="border border-[#222] p-5 sticky top-6">
              <div className="text-xs text-[#555] uppercase tracking-widest mb-1">{editingId ? 'Editando' : 'Nueva herramienta'}</div>
              <h3 className="text-lg font-bold text-white mb-5">{editingId ? tools.find(t => t.id === editingId)?.name : 'Agregar'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Nombre <span className="text-[#FF2D00]">*</span></label>
                  <input type="text" placeholder="Ej: Taladro Percutor" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError('') }}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Categoría</label>
                  <input type="text" placeholder="Ej: Taladros, Lijadoras..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">No. de Serie</label>
                  <input type="text" placeholder="Ej: BOC-2241" value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Notas</label>
                  <textarea rows={3} placeholder="Marca, modelo, ubicación habitual..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] resize-none transition-colors" />
                </div>
                {formError && <div className="text-xs text-[#FF2D00] border border-[#FF2D00]/30 bg-[#FF2D00]/5 px-3 py-2">{formError}</div>}
                <div className="flex gap-2 pt-1">
                  {editingId && <button onClick={openNew} className="px-4 py-2.5 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>}
                  <button onClick={save} className="flex-1 py-2.5 text-xs uppercase tracking-widest font-bold bg-white text-black hover:bg-[#e8e8e8] transition-all cursor-pointer">{editingId ? 'Guardar cambios' : 'Agregar herramienta'}</button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-end justify-between mb-4">
              <div className="text-xs text-[#444]">{tools.length} registros</div>
            </div>
            {tools.length === 0 && <div className="border border-[#1a1a1a] p-10 text-center text-[#444] text-sm">Sin herramientas registradas.</div>}
            <div className="space-y-2">
              {tools.map(t => {
                const isEditing = editingId === t.id
                return (
                  <div key={t.id} className={`border p-4 transition-all ${isEditing ? 'border-white bg-[#0d0d0d]' : 'border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TOOL_STATUS_COLOR[t.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{t.name}</span>
                          {t.category && <span className="text-xs text-[#555] border border-[#222] px-2 py-0.5">{t.category}</span>}
                          <ToolBadge status={t.status} />
                        </div>
                        {t.serial && <p className="text-xs text-[#444] mt-0.5">S/N: {t.serial}</p>}
                        {t.notes && <p className="text-xs text-[#555] mt-0.5 truncate">{t.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => isEditing ? openNew() : openEdit(t)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-white hover:border-white transition-all cursor-pointer">{isEditing ? 'Esc' : 'Editar'}</button>
                        <button onClick={() => setDeleteConfirm(t.id)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-all cursor-pointer">Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BITÁCORA ── */}
      {subview === 'bitacora' && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="text-xs text-[#444]">{filteredLogs.length} registros</div>
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            <button onClick={() => setLogFilter('ALL')} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${logFilter === 'ALL' ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>Todas</button>
            {logNames.map(n => (
              <button key={n} onClick={() => setLogFilter(n)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${logFilter === n ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>{n}</button>
            ))}
          </div>
          {filteredLogs.length === 0 && <div className="border border-[#1a1a1a] p-12 text-center text-[#444] text-sm">Sin cambios registrados aún.</div>}
          <div className="space-y-2">
            {filteredLogs.map(l => (
              <div key={l.id} className="border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-white">{l.toolName}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: TOOL_STATUS_COLOR[l.from] }}>{TOOL_STATUS_LABEL[l.from]}</span>
                    <span className="text-[#444]">→</span>
                    <span style={{ color: TOOL_STATUS_COLOR[l.to] }}>{TOOL_STATUS_LABEL[l.to]}</span>
                  </div>
                  <span className="text-xs text-[#444] ml-auto font-mono">{formatDate(l.at)} {formatTime(l.at)}</span>
                </div>
                {l.note && <p className="text-sm text-[#888]">{l.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setStatusModal(null) }}>
          <div className="bg-[#0d0d0d] border border-[#333] w-full max-w-md p-6">
            <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Actualizar estado</div>
            <h3 className="text-xl font-bold text-white mb-1">{statusModal.name}</h3>
            <p className="text-xs text-[#555] mb-5">Estado actual: <span style={{ color: TOOL_STATUS_COLOR[statusModal.status] }}>{TOOL_STATUS_LABEL[statusModal.status]}</span></p>
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">Nuevo estado</label>
              <div className="grid grid-cols-2 gap-2">
                {(['stored', 'in_use', 'maintenance', 'damaged'] as ToolStatus[]).map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className="px-3 py-3 text-xs font-bold border transition-all cursor-pointer text-left"
                    style={newStatus === s ? { background: TOOL_STATUS_BG[s], borderColor: TOOL_STATUS_COLOR[s], color: TOOL_STATUS_COLOR[s] } : { background: 'transparent', borderColor: '#222', color: '#555' }}>
                    ● {TOOL_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest text-[#555] mb-2">Nota / Motivo</label>
              <textarea rows={3} autoFocus placeholder="Ej: En mantenimiento preventivo, lubricación general..." value={statusNote} onChange={e => setStatusNote(e.target.value)}
                className="w-full bg-[#080808] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-white placeholder-[#333] resize-none transition-colors" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal(null)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>
              <button onClick={applyStatus} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold bg-white text-black hover:bg-[#e8e8e8] transition-all cursor-pointer">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="bg-[#0d0d0d] border border-[#FF2D00]/40 w-full max-w-sm p-6">
            <div className="text-xs text-[#FF2D00] uppercase tracking-widest mb-1">Confirmación</div>
            <h3 className="text-xl font-bold text-white mb-2">Eliminar herramienta</h3>
            <p className="text-sm text-[#888] mb-1">¿Eliminar <span className="text-white font-bold">{tools.find(t => t.id === deleteConfirm)?.name}</span>?</p>
            <p className="text-xs text-[#555] mb-6">La bitácora se conservará.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>
              <button onClick={() => remove(deleteConfirm)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold bg-[#FF2D00] text-white hover:bg-[#FF4422] transition-all cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
