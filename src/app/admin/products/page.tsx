import { prisma } from "@/app/lib/prisma";
import { calculatePrices } from "@/app/lib/pricing-engine";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import AdminSearch from "./admin-search";
import VisibilityToggle from "./visibility-toggle";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const keywords = query.split(" ").filter(word => word.length > 2);
  const searchFilter = {
    AND: keywords.map(word => {
      const stem = word.length > 5 ? word.substring(0, word.length - 2) : word;
      return { name: { contains: stem, mode: 'insensitive' as const } };
    })
  };

  const totalProducts = await prisma.product.count({ where: searchFilter });
  const products = await prisma.product.findMany({
    where: searchFilter,
    include: { providerProducts: { include: { provider: true } } },
    orderBy: { name: 'asc' },
    take: pageSize,
    skip: skip,
  });

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">INVENTARIO</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Control de visibilidad y rentabilidad</p>
          </div>
          <AdminSearch initialQuery={query} />
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="p-6 text-center">Visible</th>
                <th className="p-6">Producto / SKU</th>
                <th className="p-6">Costo Neto</th>
                <th className="p-6 text-green-600">Ganancia (30%)</th>
                <th className="p-6 text-blue-600 font-bold underline">Venta Contado</th>
                <th className="p-6 text-indigo-600">Venta Web</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => {
                const provProd = product.providerProducts[0];
                if (!provProd) return null;
                
                const prices = calculatePrices(
                  provProd.providerPrice,
                  provProd.provider.baseDiscount,
                  product.baseMargin,
                  product.cardInterest
                );

                const gananciaEfectivo = prices.precioContado - prices.costoNeto;

                return (
                  <tr key={product.id} className={`transition-colors ${product.published ? 'hover:bg-slate-50/50' : 'bg-slate-50/30 opacity-60'}`}>
                    <td className="p-6">
                      <VisibilityToggle id={product.id} initialState={product.published} />
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-bold text-slate-300 block mb-1">{product.internalSku} | {provProd.provider.name}</span>
                      <span className="text-xs font-black text-slate-800 uppercase leading-tight block max-w-xs">{product.name}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] text-slate-400 line-through block">${provProd.providerPrice.toLocaleString()}</span>
                      <span className="text-sm font-bold text-slate-600">${prices.costoNeto.toLocaleString()}</span>
                    </td>
                    <td className="p-6">
                      <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full inline-block text-sm font-black border border-green-100">
                        +${gananciaEfectivo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-lg font-black text-blue-600 tracking-tighter">
                        ${prices.precioContado.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-black text-indigo-700">
                        ${prices.precioWeb.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-300 uppercase">
                        3 x ${prices.valorCuota.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="p-8 bg-slate-50/30 border-t flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-300 uppercase">Total: {totalProducts} items | Pág {page} de {totalPages}</span>
            <div className="flex gap-3">
              <Link href={`?q=${query}&page=${Math.max(1, page - 1)}`} className={`p-3 rounded-2xl border bg-white ${page <= 1 ? 'opacity-20 pointer-events-none' : 'hover:shadow-md'}`}><ChevronLeft size={20}/></Link>
              <Link href={`?q=${query}&page=${Math.min(totalPages, page + 1)}`} className={`p-3 rounded-2xl border bg-white ${page >= totalPages ? 'opacity-20 pointer-events-none' : 'hover:shadow-md'}`}><ChevronRight size={20}/></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}