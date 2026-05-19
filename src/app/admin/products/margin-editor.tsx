'use client'
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProductMargin } from './actions';
import { Check, RefreshCcw, Loader2 } from 'lucide-react';

export default function MarginEditor({ id, currentMargin }: { id: string, currentMargin: number | null }) {
  const [margin, setMargin] = useState(currentMargin?.toString() || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // Hook para refrescar

  const handleSave = () => {
    const value = margin === "" ? null : parseFloat(margin);
    
    startTransition(async () => {
      const res = await updateProductMargin(id, value);
      if (res.success) {
        router.refresh(); // ESTO obliga a la tabla a mostrar los nuevos precios
      } else {
        alert("Error al guardar el margen");
      }
    });
  };



  const handleBlur = () => {
    const parsed = value === '' ? null : Number(value);
    if (parsed !== initialMargin) {
      startTransition(() => updateProductMargin(id, parsed));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20">
        <input 
          type="number" 
          value={margin}
          placeholder="30"
          className={`w-full p-2 pr-6 text-xs font-black rounded-lg border-2 transition-all outline-none ${currentMargin !== null ? 'border-[#f3b229] bg-yellow-50 text-[#103f79]' : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-[#103f79]'}`}
          onChange={(e) => setMargin(e.target.value)}
        />
        <span className="absolute right-2 top-2 text-[10px] opacity-30">%</span>
      </div>
      
      {isPending ? (
        <Loader2 className="animate-spin text-[#103f79]" size={16} />
      ) : (
        <div className="flex gap-1">
          <button 
            onClick={handleSave}
            className="p-2 bg-[#103f79] text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Check size={14} />
          </button>
          {currentMargin !== null && (
            <button 
              onClick={() => { 
                setMargin(""); 
                startTransition(async () => {
                   await updateProductMargin(id, null);
                   router.refresh();
                });
              }}
              className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              <RefreshCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
