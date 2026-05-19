"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { ADMIN_EMAILS } from "@/app/lib/config";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false); // Estado para la salida
  
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
      if (event === 'SIGNED_OUT') {
        window.location.replace('/login');
      } else if (session) {
        setUser(session.user);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  // 1. GHOST NAVBAR: Evita el parpadeo y saltos de diseño mientras carga
  if (loading) {
    return (
      <header className="sticky top-0 z-[100] w-full bg-[#103f79] border-b-4 border-[#f3b229] shadow-lg h-16 sm:h-20 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
           <div className="w-32 h-8 bg-white/10 rounded-lg"></div>
        </div>
      </header>
    );
  }

  if (!user) return null;

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const isInsideAdmin = pathname.startsWith("/admin");

  const handleSignOut = async () => {
    setIsExiting(true); // Activamos el efecto visual de salida inmediato
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* 2. EXIT OVERLAY: Pantalla de transición elegante al salir */}
      {isExiting && (
        <div className="fixed inset-0 z-[200] bg-[#103f79] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-black uppercase tracking-[0.2em] text-xs">Cerrando Sesión...</p>
        </div>
      )}

      <header className="sticky top-0 z-[100] w-full bg-[#103f79] border-b-4 border-[#f3b229] shadow-lg overflow-x-hidden">
        <nav className="w-full max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/catalogo" className="flex items-center gap-3">
              <div className="flex items-center justify-center py-2">
                <img
                  src="/logo-navbar.png"
                  alt="JM HNOS"
                  className="h-12 px-4 w-auto object-contain"
                />
              </div>
            </Link>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${pathname === "/admin" ? "bg-[#f3b229] text-[#103f79]" : "text-white/50 hover:text-white"}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${pathname === "/admin/products" ? "bg-[#f3b229] text-[#103f79]" : "text-white/50 hover:text-white"}`}
                >
                  Inventario
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end leading-none mr-2">
              <span className="text-[8px] font-black text-[#f3b229] uppercase mb-1">
                Profesional
              </span>
              <span className="text-xs font-bold text-white/90">
                {user.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}