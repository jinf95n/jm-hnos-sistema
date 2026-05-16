'use client'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LogOut, LayoutDashboard, List, ShoppingBag, User as UserIcon, ShieldCheck } from 'lucide-react';
import { ADMIN_EMAILS } from '@/app/lib/config';

export default function Navbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // VITAL: Ahora isAdmin depende del MAIL, no de la URL
  const isAdminUser = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
  const isInsideAdmin = pathname.startsWith('/admin');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 p-4 sticky top-0 z-[100] backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LADO IZQUIERDO: Logos y Navegación Principal */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Link href="/catalogo" className="flex flex-col group">
            <span className="text-xl font-black text-blue-600 tracking-tighter leading-none group-hover:text-blue-700 transition-colors">
              JM HNOS
            </span>
            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">
              Catálogo
            </span>
          </Link>
          
          {/* Si es ADMIN, siempre le mostramos el acceso al panel, esté donde esté */}
          {isAdminUser && (
            <div className="flex gap-4 sm:gap-6 border-l pl-6 border-slate-100">
              <Link 
                href="/admin" 
                className={`flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${isInsideAdmin ? 'text-blue-600 bg-blue-50 px-3 py-2 rounded-xl' : 'text-slate-400 hover:text-blue-600'}`}
              >
                <ShieldCheck size={14} /> 
                <span className={isInsideAdmin ? 'inline' : 'hidden md:inline'}>Panel Control</span>
              </Link>
              
              {/* Solo mostramos estos links rápidos si ya está dentro de admin */}
              {isInsideAdmin && (
                <>
                  <Link href="/admin/products" className="hidden lg:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">
                    <List size={14} /> Inventario
                  </Link>
                  <Link href="/admin/import" className="hidden lg:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">
                    <ShoppingBag size={14} /> Importar
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* LADO DERECHO: Usuario y Salida */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Conectado como</span>
            <span className="text-[11px] font-bold text-slate-600 max-w-[120px] truncate sm:max-w-none">
              {userEmail?.split('@')[0]} {/* Muestra el nombre antes del @ */}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}