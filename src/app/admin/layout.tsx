'use client'
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { LogOut, List, ShoppingBag, ShieldCheck } from 'lucide-react';
import { ADMIN_EMAILS } from '@/app/lib/config';

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  // Mientras carga o si no hay usuario, no mostramos la barra 
  // (el middleware ya protege las páginas)
  if (loading || !userEmail) {
    return <div className="h-16 bg-white border-b border-slate-50" />;
  }

  const isAdminUser = ADMIN_EMAILS.includes(userEmail);
  const isInsideAdmin = pathname.startsWith('/admin');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-slate-100 p-4 sticky top-0 z-[100] backdrop-blur-md bg-white/80 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/catalogo" className="flex flex-col">
            <span className="text-xl font-black text-blue-600 tracking-tighter leading-none">JM HNOS</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catálogo</span>
          </Link>

          {isAdminUser && (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all ${isInsideAdmin ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-blue-600'}`}
            >
              <ShieldCheck size={14} /> Panel Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end leading-none">
            <span className="text-[11px] font-bold text-slate-600">{userEmail.split('@')[0]}</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}