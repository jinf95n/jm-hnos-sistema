'use client'
import { useTransition } from 'react';
import { toggleProductVisibility } from './actions';
import { Loader2 } from 'lucide-react';

export default function VisibilityToggle({ id, initialState }: { id: string, initialState: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-center">
      {isPending ? (
        <Loader2 className="animate-spin text-blue-500" size={16} />
      ) : (
        <input 
          type="checkbox"
          defaultChecked={initialState}
          onChange={(e) => {
            const val = e.target.checked;
            startTransition(() => toggleProductVisibility(id, val));
          }}
          className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
        />
      )}
    </div>
  );
}