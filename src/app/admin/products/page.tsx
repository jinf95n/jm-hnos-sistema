export const dynamic = 'force-dynamic';

import { prisma } from "@/app/lib/prisma";
import { calculatePrices } from "@/app/lib/pricing-engine";
import { ChevronLeft, ChevronRight, Hash, DollarSign } from "lucide-react";
import Link from "next/link";
import AdminSearch from "./admin-search";
import VisibilityToggle from "./visibility-toggle";
import MarginEditor from "./margin-editor";
import ProductRowName from "./product-row-client";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const [settings, totalProducts, products] = await Promise.all([
    prisma.globalSettings.findUnique({ where: { id: 1 } }),
    prisma.product.count({
      where: { AND: query.split(" ").filter(w => w.length > 2).map(w => ({ name: { contains: w.substring(0, w.length - 2), mode: 'insensitive' as const } })) }
    }),
    prisma.product.findMany({
      where: { AND: query.split(" ").filter(w => w.length > 2).map(w => ({ name: { contains: w.substring(0, w.length - 2), mode: 'insensitive' as const } })) },
      include: { providerProducts: { include: { provider: true } } },
      orderBy: { name: 'asc' },
      take: pageSize,
      skip: skip,
    })
  ]);

  const defaultMargin = settings?.defaultMargin || 30;
  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between gap-4">
          <h1 className="text-3xl font-black text-[#103f79]">INVENTARIO</h1>
          <AdminSearch initialQuery={query} />
        </header>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 text-center w-16">Pub.</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Costo Neto</th>
                  <th className="p-4">Margen %</th>
                  <th className="p-4 text-[#103f79]">Contado</th>
                  <th className="p-4 text-indigo-600">3 Cuotas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => {
                  const prov = p.providerProducts[0];
                  if (!prov) return null;
                  const res = calculatePrices(prov.providerPrice, prov.provider.baseDiscount, defaultMargin, p.cardInterest, p.customMargin);

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-all ${!p.published && 'opacity-40 grayscale'}`}>
                      <td className="p-4 text-center">
                        <VisibilityToggle id={p.id} initialState={p.published} />
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{p.internalSku}</p>
                        <ProductRowName product={p} prices={res} />
                      </td>
                      <td className="p-4 font-bold text-slate-500">
                        ${res.costoNeto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-4">
                        <MarginEditor id={p.id} currentMargin={p.customMargin} />
                      </td>
                      <td className="p-4">
                        <p className="text-base font-black text-[#103f79]">${res.precioContado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase">Ganas: ${(res.precioContado - res.costoNeto).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-black text-indigo-700">${res.precioWeb.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] font-bold text-indigo-300">3 x ${res.valorCuota.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="p-6 bg-slate-50 border-t flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-300 uppercase">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Link href={`?q=${query}&page=${Math.max(1, page - 1)}`} className="p-2 bg-white rounded-xl border border-slate-200"><ChevronLeft size={18} /></Link>
              <Link href={`?q=${query}&page=${Math.min(totalPages, page + 1)}`} className="p-2 bg-white rounded-xl border border-slate-200"><ChevronRight size={18} /></Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}