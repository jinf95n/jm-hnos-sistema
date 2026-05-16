"use client";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
         redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-xl p-10 text-center border border-slate-100">
        <h1 className="text-4xl font-black text-blue-600 mb-2">JM HNOS</h1>
        <p className="text-slate-400 text-sm mb-10 font-medium">
          Acceso para Profesionales
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 mb-4"
        >
          {/* Usamos img normal para evitar errores de configuración de host */}
          <img
            src="https://www.google.com/favicon.ico"
            width="20"
            height="20"
            alt="Google"
          />
          Ingresar con Google
        </button>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Al entrar, tendrás acceso a precios mayoristas y stock bajo pedido.
        </p>
      </div>
    </div>
  );
}
