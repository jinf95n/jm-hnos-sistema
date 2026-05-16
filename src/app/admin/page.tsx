export const dynamic = 'force-dynamic';

import { prisma } from "@/app/lib/prisma";
import { ShoppingBag, RefreshCw, Settings2, ExternalLink, AlertTriangle } from "lucide-react";
import OrderActions from "./order-actions";
import SettingsForm from "./settings/settings-form";
import Link from "next/link";

export default async function AdminDashboard() {
  // 1. Intentamos traer los datos con valores por defecto si fallan
  const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } }).catch(() => null);
  const providers = await prisma.provider.findMany({ 
    include: { _count: { select: { products: true } } } 
  }).catch(() => []);
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDIENTE" },
    include: { 
      user: true, 
      items: { include: { product: { include: { providerProducts: { include: { provider: true } } } } } } 
    },
    orderBy: { createdAt: 'desc' }
  }).catch(() => []);

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen space-y-8 text-slate-900">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-2">CENTRO DE MANDO</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Panel de Control JM HNOS</p>
        </div>
        <Link href="/catalogo" className="text-[10px] font-black bg-white border px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          CATÁLOGO <ExternalLink size={12} />
        </Link>
      </header>

      {/* Alerta si la DB está vacía */}
      {providers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4">
          <AlertTriangle className="text-amber-500" size={32} />
          <div>
            <p className="font-black text-amber-800 text-sm uppercase">Base de datos sin inicializar</p>
            <p className="text-amber-600 text-xs">Andá a la sección de "Importar" para cargar tus primeras listas de precios.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ajustes */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Settings2 size={20} /></div>
            <h2 className="font-black text-slate-800 uppercase text-sm">Finanzas</h2>
          </div>
          <SettingsForm initialSettings={settings} />
        </section>

        {/* Proveedores */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><RefreshCw size={20} /></div>
            <h2 className="font-black text-slate-800 uppercase text-sm">Proveedores</h2>
          </div>
          <div className="space-y-4">
            {providers.length > 0 ? providers.map(p => (
              <div key={p.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <div>
                  <p className="font-black text-slate-800 text-sm tracking-tight">{p.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{p._count.products} productos</p>
                </div>
                <p className="font-black text-orange-500 text-sm">-{p.baseDiscount}%</p>
              </div>
            )) : <p className="text-slate-300 text-xs font-bold text-center py-4">No hay proveedores cargados.</p>}
          </div>
          <Link href="/admin/import" className="mt-8 block text-center py-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-blue-500 hover:text-blue-600">
            Importar Listas
          </Link>
        </section>

        {/* Consultas */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 p-2 rounded-xl text-green-600"><ShoppingBag size={20} /></div>
            <h2 className="font-black text-slate-800 uppercase text-sm">Consultas</h2>
          </div>
          <div className="space-y-6">
            {pendingOrders.length > 0 ? pendingOrders.map(order => (
              <div key={order.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-black text-slate-800 text-xs uppercase">{order.user.name}</p>
                  <span className="text-green-600 font-black text-sm">${order.total.toLocaleString()}</span>
                </div>
                {(() => {
                  const grouped: any = {};
                  order.items.forEach((item: any) => {
                    const provName = item.product?.providerProducts?.[0]?.provider?.name || 'Varios';
                    if (!grouped[provName]) grouped[provName] = [];
                    grouped[provName].push(item);
                  });
                  return <OrderActions order={order} itemsByProvider={grouped} />;
                })()}
              </div>
            )) : (
              <p className="text-slate-300 text-xs font-bold text-center py-10 uppercase tracking-widest">Sin consultas nuevas</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}