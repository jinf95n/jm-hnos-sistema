"use client";
import { updateSettings } from "./actions";
import { useState } from "react";
import { CheckCircle2, Loader2, Info } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setLoading(true);
  setSuccess(false);

  const formData = new FormData(e.currentTarget);
  // Forzamos a TS a entender que esto devuelve el objeto de éxito
  const result = await updateSettings(formData) as { success: boolean };

  if (result?.success) {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  }
  setLoading(false);
}

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">
        Configuración de Precios
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 space-y-10 relative overflow-hidden"
      >
        {/* Loader de Proceso Largo */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
            <p className="font-black text-slate-800 text-lg">
              ACTUALIZANDO TODA LA LISTA
            </p>
            <p className="text-slate-500 text-sm">
              Esto puede tardar unos segundos ya que estamos recalculando +5000
              precios...
            </p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Margen de Ganancia Neto (%)
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300">
              %
            </span>
            <input
              name="margin"
              type="number"
              step="0.1"
              defaultValue={30}
              required
              className="w-full text-5xl font-black text-blue-600 border-none bg-slate-50 rounded-3xl py-8 pl-16 pr-6 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Recargo Financiero (3 Cuotas) (%)
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300">
              %
            </span>
            <input
              name="interest"
              type="number"
              step="0.1"
              defaultValue={17.5}
              required
              className="w-full text-5xl font-black text-indigo-600 border-none bg-slate-50 rounded-3xl py-8 pl-16 pr-6 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <div className="mt-4 flex gap-2 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-indigo-700 text-xs font-medium">
            <Info size={16} className="shrink-0" />
            <p>
              Sugerido: 17.5% para cubrir costos de Naranja X / Mercado Pago y
              recibir el dinero en 14 días.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-blue-900/20 disabled:bg-slate-200"
        >
          {loading ? "PROCESANDO..." : "GUARDAR Y ACTUALIZAR TODO"}
        </button>

        {success && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold animate-bounce">
            <CheckCircle2 size={20} />
            <span>¡Precios actualizados con éxito!</span>
          </div>
        )}
      </form>
    </div>
  );
}
