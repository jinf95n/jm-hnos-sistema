'use client'
import { updateSettings } from "./actions";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSettings(formData) as { success: boolean };
    
    if (result?.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      )}
      
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Margen Ganancia (%)</label>
        <input name="margin" type="number" step="0.1" defaultValue={initialSettings?.defaultMargin || 30} className="w-full bg-slate-50 rounded-2xl p-4 text-3xl font-black text-blue-600 border-none focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Interés 3 Cuotas (%)</label>
        <input name="interest" type="number" step="0.1" defaultValue={initialSettings?.defaultCardInterest || 17.5} className="w-full bg-slate-50 rounded-2xl p-4 text-3xl font-black text-indigo-600 border-none focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      
      <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50">
        {success ? '¡ACTUALIZADO!' : 'Actualizar Precios'}
      </button>

      {success && (
        <p className="text-center text-green-600 text-xs font-bold animate-bounce">
          Los precios se están recalculando...
        </p>
      )}
    </form>
  );
}