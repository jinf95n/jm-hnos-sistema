'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { syncBatch } from './actions'
import { Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'

export default function ImportPage() {
  const [status, setStatus] = useState<{
    loading: boolean,
    current: number,
    total: number,
    provider: string | null,
    error: string | null
  }>({
    loading: false, current: 0, total: 0, provider: null, error: null
  })

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ABC' | 'CARMAR' | 'FADEPA') => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus({ loading: true, current: 0, total: 0, provider: type, error: null })

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        let items: any[] = []

        if (type === 'FADEPA') {
          // Lectura por posición para FADEPA
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
          items = rawData.map(row => {
            const sku = String(row[1] || "").trim()
            const name = String(row[2] || "").trim()
            const rawPrice = row[6]
            
            let price = 0
            if (typeof rawPrice === 'number') {
              price = rawPrice
            } else {
              let p = String(rawPrice || "0").replace(/[$. ]/g, '').replace(',', '.')
              price = parseFloat(p)
            }
            return { sku, name, price }
          }).filter(i => i.sku && i.price > 0 && i.sku !== "Producto" && i.sku !== "FA")

        } else {
          // Lectura por nombres de columna para ABC y CARMAR
          const rawData = XLSX.utils.sheet_to_json(ws) as any[]
          items = rawData.map(row => {
            const clean: any = {}
            Object.keys(row).forEach(k => clean[k.trim().toLowerCase()] = row[k])
            
            let sku = "", name = "", rawPrice: any = 0
            
            if (type === 'CARMAR') {
              sku = String(clean['cod_artic'] || "").trim()
              const desc = String(clean['descrip'] || "").trim()
              const adic = String(clean['desc_adic'] || "").trim()
              name = adic && adic !== "0" ? `${desc} (${adic})` : desc
              rawPrice = clean['precio']
            } else {
              // Caso ABC
              sku = String(clean['sku'] || clean['codigo'] || "").trim()
              name = String(clean['prod_descripcion'] || clean['descripcion'] || "").trim()
              rawPrice = clean['prod_precio'] || clean['precio']
            }

            // Limpieza de precio robusta
            let price = 0
            if (typeof rawPrice === 'number') {
              price = rawPrice
            } else {
              let p = String(rawPrice || "0").trim()
              // Si tiene formato 1.250,50 -> lo pasamos a 1250.50
              if (p.includes('.') && p.includes(',')) {
                p = p.replace(/\./g, '').replace(',', '.')
              } 
              // Si tiene formato 1250,50 -> lo pasamos a 1250.50
              else if (p.includes(',')) {
                p = p.replace(',', '.')
              }
              price = parseFloat(p.replace(/[$. ]/g, ''))
            }

            return { sku, name, price }
          }).filter(i => i.sku && i.price > 0)
        }

        if (items.length === 0) throw new Error("No se encontraron productos válidos en el archivo.")

        setStatus(s => ({ ...s, total: items.length }))

        // ENVÍO POR LOTES DE 50 (Más seguro para la base de datos)
        const batchSize = 30
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize)
          const isLast = (i + batchSize) >= items.length
          
          // Mandamos el lote indicando si es el último
          const res = await syncBatch(type, batch, type === 'FADEPA' ? 'Pinturería' : 'Ferretería', isLast)
          
          if (!res.success) {
            setStatus(s => ({ ...s, loading: false, error: `Error en el lote de la fila ${i}. Reintentando...` }))
            // Opcional: Podrías poner un 'break' o un 'continue'
          }
          
          setStatus(s => ({ ...s, current: Math.min(i + batchSize, items.length) }))
        }

        // Finalización exitosa
        e.target.value = "" // Limpiar el input
        setTimeout(() => {
          setStatus(s => ({ ...s, loading: false }))
        }, 1500)

      } catch (err: any) {
        console.error(err)
        setStatus(s => ({ ...s, loading: false, error: err.message || "Error al procesar el archivo." }))
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Importador de Listas</h1>

      {/* Pantalla de Carga / Progreso */}
      {status.loading && (
        <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-2">Procesando {status.provider}</p>
              <h2 className="text-4xl font-black">{Math.round((status.current / status.total) * 100)}%</h2>
            </div>
            <Loader2 className="animate-spin mb-1" size={40} />
          </div>
          <div className="h-4 w-full bg-blue-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${(status.current / status.total) * 100}%` }}
            ></div>
          </div>
          <p className="mt-4 text-sm font-bold text-blue-100">
            Sincronizados {status.current.toLocaleString()} de {status.total.toLocaleString()} productos...
          </p>
        </div>
      )}

      {/* Grid de Selectores */}
      {!status.loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['ABC', 'CARMAR', 'FADEPA'].map((prov) => (
            <div key={prov} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-2 h-full ${prov === 'ABC' ? 'bg-blue-500' : prov === 'CARMAR' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <FileSpreadsheet className="text-slate-200 mb-4 group-hover:text-slate-400 transition-colors" size={32} />
              <h3 className="font-black text-slate-800 mb-1">{prov}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 tracking-widest">Excel / XLS / CSV</p>
              
              <label className="block">
                <span className="sr-only">Elegir archivo</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => processFile(e, prov as any)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {status.error && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4 text-red-600 animate-bounce">
          <AlertCircle />
          <p className="font-bold text-sm">{status.error}</p>
        </div>
      )}

      {!status.loading && status.current > 0 && !status.error && (
        <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] flex items-center gap-4 text-green-600">
          <CheckCircle2 />
          <p className="font-bold text-sm">¡Sincronización completa! Se procesaron {status.total} productos.</p>
        </div>
      )}
    </div>
  )
}