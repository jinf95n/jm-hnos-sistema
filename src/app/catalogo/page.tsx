import { prisma } from "@/app/lib/prisma";
import { calculatePrices } from "@/app/lib/pricing-engine";
import CatalogClient from "./catalog-client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = Number(params.page) || 1;
  const pageSize = 40;
  const skip = (page - 1) * pageSize;

  const keywords = query.split(" ").filter(word => word.length > 2);

const searchFilter = {
  published: true,
  AND: keywords.map(word => {
    // Tomamos la raíz de la palabra (quitamos las últimas 2 letras si es larga)
    // Esto hace que "presurizadora" machee con "presurizador"
    const stem = word.length > 5 ? word.substring(0, word.length - 2) : word;
    
    // Normalizamos puntos y comas en la búsqueda también
    const alt = stem.includes('.') ? stem.replace('.', ',') : stem.includes(',') ? stem.replace(',', '.') : null;

    if (alt) {
      return { OR: [{ name: { contains: stem, mode: 'insensitive' as const } }, { name: { contains: alt, mode: 'insensitive' as const } }] };
    }
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

  const productsWithPrices = products.map(p => {
    const prov = p.providerProducts[0];
    const prices = calculatePrices(prov?.providerPrice || 0, prov?.provider?.baseDiscount || 0, p.baseMargin, p.cardInterest);
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
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter">JM HNOS</h1>
          <div className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase">Profesionales</div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Este componente maneja el input de búsqueda y el carrito */}
        <CatalogClient initialProducts={productsWithPrices} initialQuery={query} />

        {/* Paginación para el cliente */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <Link 
            href={`?q=${query}&page=${Math.max(1, page - 1)}`} 
            className={`p-4 rounded-2xl bg-white shadow-sm border ${page <= 1 ? 'opacity-20 pointer-events-none' : 'active:scale-95'}`}
          >
            <ChevronLeft size={24} className="text-blue-600" />
          </Link>
          <span className="font-bold text-slate-400 text-sm">Página {page} de {totalPages || 1}</span>
          <Link 
            href={`?q=${query}&page=${Math.min(totalPages, page + 1)}`} 
            className={`p-4 rounded-2xl bg-white shadow-sm border ${page >= totalPages ? 'opacity-20 pointer-events-none' : 'active:scale-95'}`}
          >
            <ChevronRight size={24} className="text-blue-600" />
          </Link>
        </div>
      </main>
    </div>
  );
}