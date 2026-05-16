'use client'
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

export default function AdminSearch({ initialQuery }: { initialQuery: string }) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (searchTerm === initialQuery) return;
    const delayDebounceFn = setTimeout(() => {
      startTransition(() => {
        router.push(`?q=${searchTerm}&page=1`, { scroll: false });
      });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialQuery, router]);

  return (
    <div className="relative w-full md:w-96 group">
      <div className="absolute left-4 top-3.5">
        {isPending ? (
          <Loader2 className="text-blue-500 animate-spin" size={18} />
        ) : (
          <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        )}
      </div>
      <input 
        type="text"
        value={searchTerm}
        placeholder="Buscar en inventario..."
        className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-10 text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && !isPending && (
        <button 
          onClick={() => { setSearchTerm(''); startTransition(() => router.push('?page=1')); }}
          className="absolute right-3 top-3.5 text-slate-300 hover:text-slate-500"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}