'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { syncBatch } from './actions'
import { Loader2, CheckCircle2, AlertCircle, UploadCloud, FileText } from 'lucide-react'

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
        const ws = wb.Sheets[wb.SheetNames[0]]
        let items: any[] = []

        if (type === 'FADEPA') {
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
          items = rawData.map(row => ({
            sku: String(row[1] || "").trim(),
            name: String(row[2] || "").trim(),
            price: typeof row[6] === 'number' ? row[6] : parseFloat(String(row[6] || "0").replace(/[$. ]/g, '').replace(',', '.'))
          })).filter(i => i.sku && i.price > 0 && i.sku !== "Producto" && i.sku !== "FA")
        } else {
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
              sku = String(clean['sku'] || clean['codigo'] || "").trim()
              name = String(clean['prod_descripcion'] || clean['descripcion'] || "").trim()
              rawPrice = clean['prod_precio'] || clean['precio']
            }
            let price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || "0").replace(/[$. ]/g, '').replace(',', '.'))
            return { sku, name, price }
          }).filter(i => i.sku && i.price > 0)
        }

        setStatus(s => ({ ...s, total: items.length }))
        const batchSize = 30
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize)
          const isLast = (i + batchSize) >= items.length
          const res = await syncBatch(type, batch, type === 'FADEPA' ? 'Pinturería' : 'Ferretería', isLast)
          if (!res.success) throw new Error(`Error en el lote ${i}`)
          setStatus(s => ({ ...s, current: Math.min(i + batchSize, items.length) }))
        }
        e.target.value = ""
        setTimeout(() => setStatus(s => ({ ...s, loading: false })), 2000)
      } catch (err: any) {
        setStatus(s => ({ ...s, loading: false, error: err.message }))
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#0f172a]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* HEADER */}
        <header className="mb-12 border-b border-slate-100 pb-8 text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tight text-[#103f79] uppercase">Actualización de Listas</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Sincronización masiva de precios y productos</p>
        </header>

        {/* PANTALLA DE CARGA MEJORADA */}
        {status.loading ? (
          <div className="max-w-2xl mx-auto bg-slate-50 rounded-[2.5rem] p-12 border border-slate-100 text-center animate-in zoom-in duration-300">
            <Loader2 className="animate-spin text-[#103f79] mx-auto mb-6" size={48} />
            <h2 className="text-2xl font-black text-[#103f79] mb-2 uppercase">Procesando {status.provider}</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-8">
              {status.current.toLocaleString()} de {status.total.toLocaleString()} productos
            </p>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-[#f3b229] transition-all duration-500"
                style={{ width: `${(status.current / status.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No cierres esta pestaña hasta finalizar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'ABC', color: '#103f79', sub: 'Ferretería General' },
              { id: 'CARMAR', color: '#f3b229', sub: 'Electricidad e Iluminación' },
              { id: 'FADEPA', color: '#22c55e', sub: 'Pinturería Profesional' }
            ].map((prov) => (
              <div key={prov.id} className="group bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText style={{ color: prov.color }} size={32} />
                </div>
                
                <h3 className="text-xl font-black text-[#103f79] mb-1">{prov.id}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{prov.sub}</p>

                <label className="w-full">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => processFile(e, prov.id as any)}
                    className="hidden"
                  />
                  <div className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-[#103f79] transition-colors flex items-center justify-center gap-2">
                    <UploadCloud size={16} />
                    Seleccionar Excel
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* FEEDBACK DE ESTADOS */}
        <div className="mt-12 max-w-md mx-auto">
          {status.error && (
            <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4 text-red-600 animate-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="font-bold text-xs uppercase tracking-tight">{status.error}</p>
            </div>
          )}

          {!status.loading && status.current > 0 && !status.error && (
            <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex flex-col items-center gap-2 text-green-600 animate-in zoom-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} />
                <p className="font-black text-xs uppercase tracking-widest">Sincronización Exitosa</p>
              </div>
              <p className="text-[10px] font-bold opacity-70">{status.total.toLocaleString()} productos actualizados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}