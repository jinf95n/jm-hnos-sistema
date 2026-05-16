export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { updateSettings } from "./settings/actions";
import { ShoppingBag, RefreshCw, Settings2, ExternalLink } from "lucide-react";
import OrderActions from "./order-actions"; // IMPORTACIÓN CORREGIDA
import Link from "next/link";



export default async function AdminDashboard() {
  // 1. Traer Ajustes
  const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });

  // 2. Traer Proveedores con conteo de productos
  const providers = await prisma.provider.findMany({
    include: { _count: { select: { products: true } } },
  });

  // 3. Traer Consultas Pendientes con TODO el detalle (Deep Include)
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDIENTE" },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              providerProducts: {
                include: {
                  provider: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            CENTRO DE MANDO
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            JM Hnos | Operación Inteligente
          </p>
        </div>
        <Link
          href="/catalogo"
          target="_blank"
          className="text-[10px] font-black bg-white border px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          VER CATÁLOGO PÚBLICO <ExternalLink size={12} />
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1: AJUSTES RÁPIDOS */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Settings2 size={20} />
            </div>
            <h2 className="font-black text-slate-800 uppercase text-sm">
              Finanzas
            </h2>
          </div>

          <form
            action={async (formData: FormData) => {
              await updateSettings(formData);
            }}
            className="space-y-8"
          >
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Margen Ganancia (%)
              </label>
              <input
                name="margin"
                type="number"
                step="0.1"
                defaultValue={settings?.defaultMargin || 30}
                className="w-full bg-slate-50 rounded-2xl p-4 text-3xl font-black text-blue-600 border-none focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Interés 3 Cuotas (%)
              </label>
              <input
                name="interest"
                type="number"
                step="0.1"
                defaultValue={settings?.defaultCardInterest || 17.5}
                className="w-full bg-slate-50 rounded-2xl p-4 text-3xl font-black text-indigo-600 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10">
              Actualizar Precios
            </button>
          </form>
        </section>

        {/* COLUMNA 2: PROVEEDORES */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
              <RefreshCw size={20} />
            </div>
            <h2 className="font-black text-slate-800 uppercase text-sm">
              Proveedores
            </h2>
          </div>
          <div className="space-y-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100"
              >
                <div>
                  <p className="font-black text-slate-800 text-sm tracking-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {p._count.products} productos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-orange-500 text-sm">
                    -{p.baseDiscount}%
                  </p>
                  <p className="text-[9px] font-black text-slate-300 uppercase">
                    Desc. Lista
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/import"
            className="mt-8 block text-center py-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            Importar Nuevas Listas
          </Link>
        </section>

        {/* COLUMNA 3: CONSULTAS RECIBIDAS */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
              <ShoppingBag size={20} />
            </div>
            <h2 className="font-black text-slate-800 uppercase text-sm">
              Consultas
            </h2>
          </div>

          <div className="space-y-6">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="font-black text-slate-800 text-xs uppercase tracking-tight">
                        {order.user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(order.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <span className="text-green-600 font-black text-sm bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>

                  {(() => {
                    const grouped: any = {};
                    order.items.forEach((item: any) => {
                      const provName =
                        item.product?.providerProducts?.[0]?.provider?.name ||
                        "Varios";
                      if (!grouped[provName]) grouped[provName] = [];
                      grouped[provName].push(item);
                    });

                    return (
                      <div className="space-y-6">
                        <ul className="text-[11px] font-medium text-slate-600 space-y-2">
                          {order.items.map((item: any) => (
                            <li key={item.id} className="flex gap-2">
                              <span className="font-black text-slate-900 shrink-0">
                                {item.quantity} x
                              </span>
                              <span className="uppercase leading-tight">
                                {item.product?.name}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* COMPONENTE DE ACCIONES (Copiar, Borrar, Vendido) */}
                        <OrderActions order={order} itemsByProvider={grouped} />
                      </div>
                    );
                  })()}
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed">
                <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.2em]">
                  Bandeja de entrada vacía
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
