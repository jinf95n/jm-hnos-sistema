export const dynamic = 'force-dynamic';

import { prisma } from "@/app/lib/prisma";
import { calculatePrices } from "@/app/lib/pricing-engine";
import CatalogClient from "./catalog-client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCcw } from "lucide-react";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  try {
    const params = await searchParams;
    const query = params.q || "";
    const page = Number(params.page) || 1;
    const pageSize = 24; // Bajamos a 24 para que la carga inicial sea más liviana
    const skip = (page - 1) * pageSize;

    const keywords = query.split(" ").filter(word => word.length > 2);

    // Búsqueda optimizada
    const searchFilter = {
      published: true,
      AND: keywords.map(word => {
        const stem = word.length > 5 ? word.substring(0, word.length - 2) : word;
        return {
          OR: [
            { name: { contains: stem, mode: 'insensitive' as const } },
            { internalSku: { contains: word, mode: 'insensitive' as const } }
          ]
        };
      })
    };

    // Ejecutamos las dos consultas en paralelo para ahorrar tiempo de conexión
    const [totalProducts, products] = await Promise.all([
      prisma.product.count({ where: searchFilter }),
      prisma.product.findMany({
        where: searchFilter,
        include: { 
          providerProducts: { 
            include: { provider: true },
            take: 1 // Solo traemos el primer precio para no sobrecargar
          } 
        },
        orderBy: { name: 'asc' },
        take: pageSize,
        skip: skip,
      })
    ]);

    const totalPages = Math.ceil(totalProducts / pageSize);

    const productsWithPrices = products.map(p => {
      const prov = p.providerProducts[0];
      const prices = calculatePrices(
        prov?.providerPrice || 0,
        prov?.provider?.baseDiscount || 0,
        p.baseMargin,
        p.cardInterest,
        p.customMargin
      );
      return {
        id: p.id,
        name: p.name,
        sku: p.internalSku,
        price: prices.precioWeb,
        cashPrice: prices.precioContado,
        valorCuota: prices.valorCuota
      };
    });

    return (
      <div className="min-h-screen bg-[#f8fafc] pb-32">
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <CatalogClient initialProducts={productsWithPrices} initialQuery={query} />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 pb-10">
              <Link 
                href={`?q=${query}&page=${Math.max(1, page - 1)}`} 
                className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 ${page <= 1 ? 'opacity-20 pointer-events-none' : 'active:scale-95 text-[#103f79]'}`}
              >
                <ChevronLeft size={24} />
              </Link>
              <span className="font-bold text-slate-400 text-sm">Página {page} de {totalPages}</span>
              <Link 
                href={`?q=${query}&page=${Math.min(totalPages, page + 1)}`} 
                className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 ${page >= totalPages ? 'opacity-20 pointer-events-none' : 'active:scale-95 text-[#103f79]'}`}
              >
                <ChevronRight size={24} />
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Crash de Catálogo:", error);
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center space-y-4">
        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex flex-col items-center">
          <AlertCircle className="text-amber-500 mb-4" size={48} />
          <h2 className="text-xl font-black text-jm-blue uppercase tracking-tight">Estamos procesando muchos pedidos</h2>
          <p className="text-slate-500 text-sm max-w-xs mt-2">La base de datos está un poco lenta. Refrescá en unos segundos.</p>
          <a href="/catalogo" className="mt-6 flex items-center gap-2 bg-[#103f79] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#f3b229] hover:text-[#103f79] transition-all">
            <RefreshCcw size={16} /> Reintentar ahora
          </a>
        </div>
      </div>
    );
  }
}