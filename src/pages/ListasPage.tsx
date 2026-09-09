import { useState } from 'react'
import { useStore, isAdminUser } from '../store'

type ListKey = 'areas' | 'machineTypes' | 'toolTypes' | 'brands' | 'stopTypes'

const LIST_INFO: { key: ListKey; label: string }[] = [
  { key: 'areas', label: 'Áreas' },
  { key: 'machineTypes', label: 'Tipos de máquina' },
  { key: 'toolTypes', label: 'Tipos de herramienta' },
  { key: 'brands', label: 'Marcas' },
  { key: 'stopTypes', label: 'Tipos de paro' },
]

export default function ListasPage() {
  const { currentUser, lists, setLists } = useStore()
  const isAdmin = isAdminUser(currentUser)
  const [selectedList, setSelectedList] = useState<ListKey>('areas')
  const [value, setValue] = useState('')
  const [editingValue, setEditingValue] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')

  const selectedInfo = LIST_INFO.find(item => item.key === selectedList) ?? LIST_INFO[0]
  const selectedValues = lists[selectedList]

  function resetForm() {
    setValue('')
    setEditingValue(null)
    setError('')
  }

  function selectList(key: ListKey) {
    setSelectedList(key)
    resetForm()
  }

  function save() {
    if (!isAdmin) return
    const nextValue = value.trim()
    if (!nextValue) {
      setError('El valor es requerido.')
      return
    }
    if (selectedValues.some(item => item.toLowerCase() === nextValue.toLowerCase() && item !== editingValue)) {
      setError('Este valor ya existe en la lista.')
      return
    }

    setLists(prev => ({
      ...prev,
      [selectedList]: editingValue
        ? prev[selectedList].map(item => item === editingValue ? nextValue : item)
        : [...prev[selectedList], nextValue],
    }))
    resetForm()
  }

  function edit(item: string) {
    if (!isAdmin) return
    setEditingValue(item)
    setValue(item)
    setError('')
  }

  function remove(item: string) {
    if (!isAdmin) return
    setLists(prev => ({ ...prev, [selectedList]: prev[selectedList].filter(current => current !== item) }))
    if (editingValue === item) resetForm()
    setDeleteConfirm(null)
  }

  if (!isAdmin) return null

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs text-[#555] uppercase tracking-widest mb-1">Administración</div>
        <h1 className="text-3xl font-extrabold text-white">Listas</h1>
        <p className="text-sm text-[#666] mt-2">Administra las opciones disponibles en máquinas, herramientas y paros.</p>
      </div>

      <div className="flex gap-1 flex-wrap mb-8 pb-6 border-b border-[#1a1a1a]">
        {LIST_INFO.map(item => (
          <button key={item.key} onClick={() => selectList(item.key)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-all cursor-pointer ${selectedList === item.key ? 'bg-white text-black border-white' : 'border-[#222] text-[#555] hover:text-[#aaa] hover:border-[#444]'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <div className="border border-[#222] p-5 sticky top-6">
            <div className="text-xs text-[#555] uppercase tracking-widest mb-1">{editingValue ? 'Editando' : 'Nuevo valor'}</div>
            <h2 className="text-lg font-bold text-white mb-5">{selectedInfo.label}</h2>
            <label className="block text-xs uppercase tracking-widest text-[#555] mb-1.5">Valor <span className="text-[#FF2D00]">*</span></label>
            <input autoFocus type="text" value={value} onChange={event => { setValue(event.target.value); setError('') }}
              placeholder={`Ej: ${selectedValues[0] ?? 'Nuevo valor'}`}
              className="w-full bg-[#080808] border border-[#333] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white placeholder-[#333] transition-colors" />
            {error && <div className="text-xs text-[#FF2D00] border border-[#FF2D00]/30 bg-[#FF2D00]/5 px-3 py-2 mt-4">{error}</div>}
            <div className="flex gap-2 pt-4">
              {editingValue && <button onClick={resetForm} className="px-4 py-2.5 text-xs uppercase tracking-widest font-bold border border-[#333] text-[#555] hover:text-[#888] hover:border-[#555] transition-all cursor-pointer">Cancelar</button>}
              <button onClick={save} className="flex-1 py-2.5 text-xs uppercase tracking-widest font-bold bg-white text-black hover:bg-[#e8e8e8] transition-all cursor-pointer">
                {editingValue ? 'Guardar cambios' : 'Agregar valor'}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="flex items-end justify-between mb-4">
            <div className="text-xs text-[#444]">{selectedValues.length} registros</div>
          </div>
          <div className="space-y-2">
            {selectedValues.map(item => (
              <div key={item} className={`border p-4 flex items-center gap-3 transition-all ${editingValue === item ? 'border-white bg-[#0d0d0d]' : 'border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]'}`}>
                <span className="w-2 h-2 rounded-full bg-[#00E87A] shrink-0" />
                <span className="text-sm font-bold text-white flex-1">{item}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => editingValue === item ? resetForm() : edit(item)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-white hover:border-white transition-all cursor-pointer">{editingValue === item ? 'Esc' : 'Editar'}</button>
                  <button onClick={() => setDeleteConfirm(item)} className="px-3 py-1.5 text-xs border border-[#333] text-[#666] hover:text-[#FF2D00] hover:border-[#FF2D00]/50 transition-all cursor-pointer">Eliminar</button>
                </div>
              </div>
            ))}
            {selectedValues.length === 0 && <div className="border border-[#1a1a1a] p-10 text-center text-[#444] text-sm">Sin valores registrados.</div>}
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={event => { if (event.target === event.currentTarget) setDeleteConfirm(null) }}>
          <div className="bg-[#0d0d0d] border border-[#FF2D00]/40 w-full max-w-sm p-6">
            <div className="text-xs text-[#FF2D00] uppercase tracking-widest mb-1">Confirmación</div>
            <h3 className="text-xl font-bold text-white mb-2">Eliminar valor</h3>
            <p className="text-sm text-[#888] mb-6">¿Eliminar <span className="text-white font-bold">{deleteConfirm}</span> de {selectedInfo.label}?</p>
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