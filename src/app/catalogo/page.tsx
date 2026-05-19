export const dynamic = 'force-dynamic';

import { prisma } from "@/app/lib/prisma";
import { calculatePrices } from "@/app/lib/pricing-engine";
import CatalogClient from "./catalog-client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCcw } from "lucide-react";
import { expandKeywords } from "@/app/lib/search-config";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  try {
    const params = await searchParams;
    const query = params.q || "";
    const page = Number(params.page) || 1;
    const pageSize = 24;
    const skip = (page - 1) * pageSize;

    // 1. Procesar palabras clave originales y expandirlas con sinónimos
    const rawKeywords = query.split(" ").filter(word => word.length > 1);
    const allKeywords = expandKeywords(rawKeywords);

    // 2. Construir filtro de búsqueda flexible (OR en lugar de AND)
    // Esto evita los "0 resultados" si una palabra no coincide exacto
    const searchFilter: any = {
      published: true,
      OR: allKeywords.map(word => {
        const stem = word.length > 5 ? word.substring(0, word.length - 2) : word;
        return {
          OR: [
            { name: { contains: stem, mode: 'insensitive' as const } },
            { internalSku: { contains: word, mode: 'insensitive' as const } }
          ]
        };
      })
    };

    // Si no hay búsqueda, mostramos los últimos publicados
    const finalFilter = rawKeywords.length > 0 ? searchFilter : { published: true };

    // 3. Ejecutar consultas
    // Traemos 200 para poder rankear los mejores arriba de todo
    const [totalProducts, products] = await Promise.all([
      prisma.product.count({ where: finalFilter }),
      prisma.product.findMany({
        where: finalFilter,
        include: { 
          providerProducts: { include: { provider: true }, take: 1 } 
        },
        orderBy: { name: 'asc' },
        take: 200, 
      })
    ]);

    // 4. MOTOR DE RANKING (Inteligencia de Relevancia)
    // Le damos puntos a cada producto según qué tanto coincide con la búsqueda real
    const scoredProducts = products.map(p => {
      let score = 0;
      const name = p.name.toLowerCase();
      const sku = p.internalSku.toLowerCase();

      rawKeywords.forEach(kw => {
        const word = kw.toLowerCase();
        // Coincidencia exacta en nombre (Prioridad Máxima)
        if (name.includes(word)) score += 100;
        // Coincidencia en SKU (Prioridad Alta)
        if (sku.includes(word)) score += 80;
        // Palabra empieza igual (Ej: "codo" coincide con "codo fus")
        if (name.startsWith(word)) score += 50;
        
        // Coincidencia de sinónimos (Prioridad Media)
        const synonyms = expandKeywords([word]);
        synonyms.forEach(syn => {
          if (name.includes(syn.toLowerCase())) score += 20;
        });
      });

      return { ...p, score };
    });

    // Ordenamos por puntaje (relevancia) y luego paginamos el resultado ordenado
    const sortedProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + pageSize);

    const totalPages = Math.ceil(totalProducts / pageSize);

    const productsWithPrices = sortedProducts.map(p => {
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
                className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 ${page <= 1 ? 'opacity-20 pointer-events-none' : 'active:scale-95 text-[#103f79] hover:bg-slate-50 transition-all'}`}
              >
                <ChevronLeft size={24} />
              </Link>
              <div className="flex flex-col items-center">
                <span className="font-black text-[#103f79] text-xs uppercase tracking-widest leading-none mb-1">Página</span>
                <span className="font-bold text-slate-400 text-sm">{page} de {totalPages}</span>
              </div>
              <Link 
                href={`?q=${query}&page=${Math.min(totalPages, page + 1)}`} 
                className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 ${page >= totalPages ? 'opacity-20 pointer-events-none' : 'active:scale-95 text-[#103f79] hover:bg-slate-50 transition-all'}`}
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center max-w-sm">
          <AlertCircle className="text-amber-500 mb-6" size={60} />
          <h2 className="text-2xl font-black text-[#103f79] uppercase tracking-tighter leading-none mb-4">Base de datos saturada</h2>
          <p className="text-slate-500 text-sm font-medium mb-8">Estamos recibiendo muchas consultas en este momento. Intentá de nuevo en unos segundos.</p>
          <a href="/catalogo" className="w-full flex items-center justify-center gap-3 bg-[#103f79] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#f3b229] hover:text-[#103f79] transition-all">
            <RefreshCcw size={18} /> Reintentar
          </a>
        </div>
      </div>
    );
  }
}