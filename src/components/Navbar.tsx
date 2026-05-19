'use client'
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { LogOut, ShieldCheck, ChevronRight, LayoutGrid, Package, ArrowUpRight } from 'lucide-react';
import { ADMIN_EMAILS } from '@/app/lib/config';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Carga inicial
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // 2. Escucha cambios (Login/Logout) en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  if (loading) return <div className="h-1 bg-jm-yellow animate-progress w-full fixed top-0" />;
  if (!user) return null;

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const isInsideAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-[100] px-4 py-4">
      <nav className="max-w-7xl mx-auto bg-jm-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] px-6 py-3 transition-all">
        <div className="flex justify-between items-center">
          
          {/* LADO IZQUIERDO: Branding */}
          <div className="flex items-center gap-8">
            <Link href="/catalogo" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-jm-yellow rounded-2xl flex items-center justify-center shadow-lg shadow-jm-yellow/20 group-hover:rotate-6 transition-transform duration-300">
                <Package size={24} className="text-jm-blue" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tighter leading-none">JM HNOS</span>
                <span className="text-[9px] font-black text-jm-yellow uppercase tracking-[0.2em]">SISTEMA PROFESIONAL</span>
              </div>
            </Link>

            {/* Navegación Admin (Pills) */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <Link 
                  href="/admin" 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${pathname === '/admin' ? 'bg-jm-yellow text-jm-blue shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                  <LayoutGrid size={14} /> Dashboard
                </Link>
                <Link 
                  href="/admin/products" 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${pathname === '/admin/products' ? 'bg-jm-yellow text-jm-blue shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                  <Package size={14} /> Inventario
                </Link>
              </div>
            )}
          </div>

          {/* LADO DERECHO: Perfil y Logout */}
          <div className="flex items-center gap-4">
            {/* Si NO está en admin y ES admin, mostramos botón rápido al panel */}
            {isAdmin && !isInsideAdmin && (
              <Link href="/admin" className="hidden sm:flex items-center gap-2 text-[10px] font-black text-jm-yellow border border-jm-yellow/30 px-4 py-2 rounded-xl hover:bg-jm-yellow hover:text-jm-blue transition-all uppercase tracking-widest">
                Panel Control <ArrowUpRight size={14} />
              </Link>
            )}

            {/* User Profile Card */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 pl-4 pr-2 py-1.5 rounded-2xl">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] font-black text-jm-yellow uppercase tracking-tighter mb-1">Online</span>
                <span className="text-xs font-bold text-white/90">{user.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-10 h-10 flex items-center justify-center bg-jm-slate-800 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all group"
                title="Cerrar Sesión"
              >
                <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}