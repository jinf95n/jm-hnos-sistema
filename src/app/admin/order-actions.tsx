"use client";
import { useState } from "react";
import { Copy, Check, Trash2, CheckCircle } from "lucide-react";
import { deleteOrder, markAsVendido } from "./actions";

export default function OrderActions({ order, itemsByProvider }: any) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (providerName: string, items: any[]) => {
    const text =
      `Hola ${providerName}, quisiera consultar stock de:\n` +
      items.map((i) => `- ${i.quantity} x ${i.product.name}`).join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="flex flex-wrap gap-2">
        {Object.keys(itemsByProvider).map((prov) => (
          <button
            key={prov}
            onClick={() => copyToClipboard(prov, itemsByProvider[prov])}
            className="flex items-center gap-2 text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            COPIAR PARA {prov}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => deleteOrder(order.id)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          <Trash2 size={14} /> Borrar Consulta
        </button>
        <button
          onClick={() => markAsVendido(order.id)}
          className="flex items-center gap-2 text-[10px] font-black text-green-500 hover:text-green-600 bg-green-50 px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-sm shadow-green-100"
        >
          <CheckCircle size={14} /> Marcar Vendido
        </button>
      </div>
    </div>
  );
}
