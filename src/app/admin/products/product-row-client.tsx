'use client'
import { useState } from 'react';
import { Info, X } from 'lucide-react';

export default function ProductRowName({ product, prices }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="cursor-pointer group max-w-xs" 
        onClick={() => setIsOpen(true)}
      >
        <p className="text-[10px] font-bold text-slate-300 uppercase mb-0.5">{product.internalSku}</p>
        <p className="font-black text-[#0f172a] uppercase leading-tight line-clamp-2 group-hover:text-[#103f79] transition-colors">
          {product.name}
        </p>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsOpen(false)} className="absolute right-6 top-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            <span className="text-[10px] font-black text-[#f3b229] uppercase tracking-widest mb-2 block">Detalle de Inventario</span>
            <h2 className="text-xl font-black text-[#103f79] uppercase leading-tight mb-6">{product.name}</h2>
            
            <div className="space-y-4 text-sm font-bold text-slate-600">
               <div className="flex justify-between border-b pb-2"><span>SKU:</span><span>{product.internalSku}</span></div>
               <div className="flex justify-between border-b pb-2"><span>Proveedor:</span><span>{product.providerProducts[0]?.provider?.name}</span></div>
               <div className="flex justify-between border-b pb-2 text-green-600"><span>Costo Neto:</span><span>${prices.costoNeto.toLocaleString('es-AR')}</span></div>
               <div className="flex justify-between border-b pb-2 text-[#103f79]"><span>Venta Cash:</span><span>${prices.precioContado.toLocaleString('es-AR')}</span></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-full mt-6 bg-[#103f79] text-white py-4 rounded-xl font-black uppercase text-xs">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}