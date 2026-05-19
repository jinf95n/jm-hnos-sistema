'use client'
import { useTransition } from 'react';
import { toggleProductVisibility } from './actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VisibilityToggle({ id, initialState }: { id: string, initialState: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center justify-center">
      {isPending ? (
        <Loader2 className="animate-spin text-[#103f79]" size={16} />
      ) : (
        <input 
          type="checkbox"
          defaultChecked={initialState}
          onChange={(e) => {
            const val = e.target.checked;
            // Envolvemos la acción para que devuelva 'void' y TS sea feliz
            startTransition(async () => {
              await toggleProductVisibility(id, val);
              router.refresh();
            });
          }}
          className="w-5 h-5 rounded-md border-slate-300 text-[#103f79] focus:ring-[#103f79] cursor-pointer transition-all"
        />
      )}
    </div>
  );
}