'use client'
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProductMargin } from './actions';
import { Loader2, Check } from 'lucide-react';

export default function MarginEditor({ id, currentMargin }: { id: string, currentMargin: number | null }) {
  // Usamos el nombre 'margin' para el estado
  const [margin, setMargin] = useState(currentMargin?.toString() || "");
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const saveMargin = async (val: string) => {
    const parsed = val === "" ? null : parseFloat(val);
    
    // Solo guardamos si el valor cambió respecto al original
    if (parsed === currentMargin) return;

    startTransition(async () => {
      const res = await updateProductMargin(id, parsed);
      if (res?.success) {
        setShowSuccess(true);
        router.refresh();
        // Ocultamos el check verde después de 2 segundos
        setTimeout(() => setShowSuccess(false), 2000);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20">
        <input 
          type="number" 
          value={margin}
          placeholder="Global"
          className={`w-full p-2 pr-6 text-[11px] font-black rounded-lg border-2 outline-none transition-all ${
            currentMargin !== null 
              ? 'border-[#f3b229] bg-yellow-50 text-[#103f79]' 
              : 'border-slate-100 bg-slate-50 text-slate-400 focus:border-[#103f79]'
          }`}
          onChange={(e) => setMargin(e.target.value)}
          onBlur={(e) => saveMargin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveMargin(margin)}
        />
        <span className="absolute right-2 top-2 text-[9px] font-bold opacity-30">%</span>
      </div>

      <div className="w-5 flex items-center justify-center">
        {isPending ? (
          <Loader2 className="animate-spin text-[#103f79]" size={14} />
        ) : showSuccess ? (
          <Check className="text-green-500" size={14} strokeWidth={3} />
        ) : null}
      </div>
    </div>
  );
}