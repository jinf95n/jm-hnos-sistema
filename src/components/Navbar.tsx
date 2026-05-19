"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { LogOut, ShieldCheck, LayoutGrid, List, Loader2, User } from "lucide-react";
import { ADMIN_EMAILS } from "@/app/lib/config";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') window.location.replace('/login');
      else if (session) setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) return (
    <header className="sticky top-0 z-[100] w-full bg-[#103f79] border-b-4 border-[#f3b229] h-16 sm:h-20 animate-pulse" />
  );

  if (!user) return null;

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const isInsideAdmin = pathname.startsWith("/admin");

  return (
    <>
      {isExiting && (
        <div className="fixed inset-0 z-[200] bg-[#103f79] flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-black uppercase tracking-widest text-xs">Cerrando...</p>
        </div>
      )}

      <header className="sticky top-0 z-[100] w-full bg-[#103f79] border-b-4 border-[#f3b229] shadow-lg">
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 h-16 sm:h-20 flex justify-between items-center">
          
          {/* IZQUIERDA: Logo y Admin */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/catalogo" className="shrink-0">
              <img src="/logo-navbar.png" alt="JM" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <Link href="/admin" className={`p-2 sm:px-3 sm:py-1.5 rounded-lg transition-all ${pathname === "/admin" ? "bg-[#f3b229] text-[#103f79]" : "text-white/50 hover:text-white"}`}>
                  <LayoutGrid size={18} className="sm:hidden" />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Dashboard</span>
                </Link>
                <Link href="/admin/products" className={`p-2 sm:px-3 sm:py-1.5 rounded-lg transition-all ${pathname === "/admin/products" ? "bg-[#f3b229] text-[#103f79]" : "text-white/50 hover:text-white"}`}>
                  <List size={18} className="sm:hidden" />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Inventario</span>
                </Link>
              </div>
            )}
          </div>

          {/* DERECHA: Usuario y Salir */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-end leading-none">
              <span className="hidden xs:block text-[7px] sm:text-[8px] font-black text-[#f3b229] uppercase mb-0.5">Profesional</span>
              <span className="text-[10px] sm:text-xs font-bold text-white/90 max-w-[70px] sm:max-w-[120px] truncate uppercase">
                {user.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={async () => { setIsExiting(true); await supabase.auth.signOut(); }}
              className="p-2 text-white/30 hover:text-red-400 bg-white/5 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}