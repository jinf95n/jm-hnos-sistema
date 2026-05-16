'use client'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LogOut, LayoutDashboard, ShoppingBag, List, Settings } from 'lucide-react';

export default function Navbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Inicializamos el cliente de Supabase para el navegador
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdmin = pathname.startsWith('/admin');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 p-4 sticky top-0 z-[100] backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link href={isAdmin ? "/admin" : "/catalogo"} className="flex flex-col">
            <span className="text-xl font-black text-blue-600 tracking-tighter leading-none">JM HNOS</span>
            {isAdmin && <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">Admin Panel</span>}
          </Link>
          
          {/* Links de navegación - Solo se muestran si es Admin */}
          {isAdmin && (
            <div className="hidden md:flex gap-8">
              <Link href="/admin" className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${pathname === '/admin' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutDashboard size={14} /> Inicio
              </Link>
              <Link href="/admin/products" className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${pathname === '/admin/products' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={14} /> Inventario
              </Link>
              <Link href="/admin/import" className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${pathname === '/admin/import' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <ShoppingBag size={14} /> Importar
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Usuario Activo</span>
            <span className="text-[11px] font-bold text-slate-500">{userEmail}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}