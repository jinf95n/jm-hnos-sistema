"use client";
import { useState } from "react";
import { importABC, importCarmar, importFadepaText } from "./actions";

export default function ImportPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [fadepaText, setFadepaText] = useState("");

  const handleUpload = async (
    e: React.FormEvent<HTMLFormElement>,
    type: "ABC" | "CARMAR" | "FADEPA",
  ) => {
    e.preventDefault();
    setLoading(type);
    const formData = new FormData(e.currentTarget);
    const result =
      type === "ABC" ? await importABC(formData) : await importCarmar(formData);
    setMessage(
      result.success
        ? `¡Éxito! ${result.count} productos de ${type} actualizados.`
        : result.error || "Error",
    );
    setLoading(null);
  };

  const handleFadepaPaste = async () => {
    setLoading("FADEPA");
    const result = await importFadepaText(fadepaText);
    setMessage(
      result.success
        ? `¡Éxito! ${result.count} productos de FADEPA detectados.`
        : "Error al procesar el texto.",
    );
    setFadepaText("");
    setLoading(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">
        Actualización de Precios
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ABC */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="h-2 w-full bg-blue-500 rounded-full mb-4"></div>
          <h2 className="font-bold text-slate-700 mb-2">ABC (Excel)</h2>
          <p className="text-xs text-slate-400 mb-4">
            Columnas: sku, prod_descripcion, prod_precio
          </p>
          <form onSubmit={(e) => handleUpload(e, "ABC")} className="space-y-3">
            <input
              type="file"
              name="file"
              accept=".xlsx"
              className="text-xs w-full"
            />
            <button
              disabled={!!loading}
              className="w-full bg-slate-800 text-white py-2 rounded-xl text-sm font-bold"
            >
              {loading === "ABC" ? "Procesando..." : "Subir ABC"}
            </button>
          </form>
        </div>

        {/* CARMAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="h-2 w-full bg-orange-500 rounded-full mb-4"></div>
          <h2 className="font-bold text-slate-700 mb-2">CARMAR (Excel)</h2>
          <p className="text-xs text-slate-400 mb-4">
            Columnas: CODIGO, DESCRIPCION, PRECIO
          </p>
          <form
            onSubmit={(e) => handleUpload(e, "CARMAR")}
            className="space-y-3"
          >
            <input
              type="file"
              name="file"
              accept=".xlsx"
              className="text-xs w-full"
            />
            <button
              disabled={!!loading}
              className="w-full bg-slate-800 text-white py-2 rounded-xl text-sm font-bold"
            >
              {loading === "CARMAR" ? "Procesando..." : "Subir CARMAR"}
            </button>
          </form>
        </div>

        {/* FADEPA (TEXT PASTE) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="h-2 w-full bg-green-500 rounded-full mb-4"></div>
          <h2 className="font-bold text-slate-700 mb-2">FADEPA (Excel)</h2>
          <p className="text-[10px] text-slate-400 mb-4 tracking-tight">
            Triple descuento (12+15+10) automático.
          </p>
          <form
            onSubmit={(e) => handleUpload(e, "FADEPA")}
            className="space-y-3"
          >
            <input
              type="file"
              name="file"
              accept=".xls,.xlsx"
              className="text-xs w-full"
            />
            <button
              disabled={!!loading}
              className="w-full bg-slate-800 text-white py-2 rounded-xl text-sm font-bold"
            >
              {loading === "FADEPA" ? "Cargando..." : "Actualizar Fadepa"}
            </button>
          </form>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-center font-bold animate-fade-in ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
