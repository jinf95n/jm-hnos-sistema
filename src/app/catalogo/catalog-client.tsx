"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  X,
  Loader2,
  ShoppingCart,
  Info,
  InfoIcon,
} from "lucide-react";
import { saveOrder } from "./actions";

export default function CatalogClient({
  initialProducts,
  initialQuery,
}: {
  initialProducts: any[];
  initialQuery: string;
}) {
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Para el Modal
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
  const savedCart = localStorage.getItem('jm-hnos-cart');
  if (savedCart) {
    try {
      setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Error cargando carrito");
    }
  }
}, []);

// 2. Guardar carrito cuando cambie
useEffect(() => {
  localStorage.setItem('jm-hnos-cart', JSON.stringify(cart));
}, [cart]);

  useEffect(() => {
    if (searchTerm === initialQuery) return;
    const delay = setTimeout(() => {
      startTransition(() => {
        router.push(`?q=${searchTerm}&page=1`, { scroll: false });
      });
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, initialQuery, router]);

  // FUNCIONES DE CARRITO CORREGIDAS (Suman/Restan de a 1)
  const addToCart = (p: any) => {
    if (Object.keys(cart).length === 0) setIsCartOpen(true);
    setCart((prev) => ({
      ...prev,
      [p.id]: { ...p, qty: (prev[p.id]?.qty || 0) + 1 },
    }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      if (!prev[id]) return prev;
      const newQty = prev[id].qty - 1;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...prev[id], qty: newQty } };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10 font-sans antialiased text-[#0f172a]">
      {/* BUSCADOR Y CARRITO */}
      <div className="sticky top-20 z-40 py-4 bg-[#f8fafc]/90 backdrop-blur-md">
        <div className="flex gap-3 items-center max-w-3xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar por nombre o código..."
              className="w-full py-3 pl-11 pr-4 rounded-xl border border-slate-200 bg-white shadow-sm focus:border-[#103f79] focus:ring-1 focus:ring-[#103f79] transition-all outline-none text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-4 top-3.5">
              {isPending ? (
                <Loader2 className="animate-spin text-[#103f79]" size={18} />
              ) : (
                <Search className="text-slate-400" size={18} />
              )}
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 py-3 px-5 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
          >
            <ShoppingCart
              size={18}
              className={cartCount > 0 ? "text-[#f3b229]" : "text-slate-400"}
            />
            <span className="text-sm font-bold">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 transition-opacity ${isPending ? "opacity-40" : "opacity-100"}`}
      >
        {initialProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-[#103f79]/30 transition-all flex flex-col justify-between group relative"
          >
            <div
              className="cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-slate-300 tracking-wider uppercase">
                  {product.sku}
                </span>
                <Info
                  size={14}
                  className="text-slate-200 group-hover:text-[#103f79] transition-colors"
                />
              </div>
              <h3 className="font-bold text-[10px] sm:text-xs uppercase leading-snug mb-3 text-slate-700 min-h-[40px] sm:min-h-[50px] whitespace-normal break-words line-clamp-3">
                {product.name}
              </h3>
            </div>

            <div>
              <div className="flex flex-col mb-3">
                <span className="text-lg font-black text-[#103f79] tracking-tight">
                  $
                  {product.price.toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 rounded py-0.5 border border-green-100">
                    $
                    {product.cashPrice.toLocaleString("es-AR", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    EFECTIVO
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart[product.id] ? (
                  <div className="flex items-center justify-between w-full bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(product.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black text-xs">
                      {cart[product.id].qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="p-1.5 text-[#103f79] hover:bg-white rounded transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-[#103f79] text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f3b229] hover:text-[#103f79] transition-all"
                  >
                    Agregar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DE DETALLE DE PRODUCTO REFINADO --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 p-1.5 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <span className="text-[9px] font-black text-[#f3b229] uppercase tracking-widest mb-2 block text-center sm:text-left">
              Detalle Técnico
            </span>
            <h2 className="text-lg font-black text-[#103f79] uppercase leading-tight mb-5 text-center sm:text-left">
              {selectedProduct.name}
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center sm:text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                  Código
                </p>
                <p className="font-bold text-xs text-slate-600">
                  {selectedProduct.sku}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center sm:text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                  Estado
                </p>
                <p className="font-bold text-xs text-green-600 uppercase">
                  Disponible
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-4 bg-[#103f79] rounded-2xl text-white shadow-lg shadow-[#103f79]/10">
                <div className="text-left leading-none">
                  <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-1">
                    3 Cuotas S/ Interés
                  </p>
                  <p className="text-[10px] opacity-80">Precio de Lista</p>
                </div>
                <p className="text-2xl font-black">
                  $
                  {selectedProduct.price.toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100 text-green-700">
                <div className="text-left leading-none">
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1">
                    Pago Contado
                  </p>
                  <p className="text-[10px] text-green-500">Ahorro Aplicado</p>
                </div>
                <p className="text-xl font-black">
                  $
                  {selectedProduct.cashPrice.toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                addToCart(selectedProduct);
                setSelectedProduct(null);
              }}
              className="w-full bg-[#f3b229] text-[#103f79] py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#f3b229]/20"
            >
              Sumar al Pedido
            </button>
          </div>
        </div>
      )}
      {/* DRAWER DEL CARRITO MÁS DELGADO */}
      <div
        className={`fixed inset-y-0 right-0 z-[110] w-full sm:w-[380px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-black text-[#103f79] tracking-tighter">
                MI PEDIDO
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {cartCount} ítems
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {cartItems.length > 0 ? (
              cartItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex-1 mr-3">
                    <h4 className="text-[10px] font-bold text-[#103f79] uppercase leading-tight line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                      $
                      {item.price.toLocaleString("es-AR", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      un.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-100">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-bold text-[11px] min-w-[12px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="text-[#103f79]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 opacity-50">
                <ShoppingCart size={32} strokeWidth={1.5} />
                <p className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Vacio
                </p>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-end mb-4 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Total
                </span>
                <span className="text-2xl font-black text-[#103f79]">
                  $
                  {cartTotal.toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <button
                onClick={async () => {
                  await saveOrder(cartItems, cartTotal);
                  const msg = cartItems
                    .map((i) => `${i.qty}x ${i.name}`)
                    .join("\n");
                  window.open(
                    `https://wa.me/5492644444444?text=${encodeURIComponent("🚀 *NUEVO PEDIDO - JM HNOS*\n\n" + msg + "\n\n*Total: $" + cartTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 }) + "*")}`,
                    "_blank",
                  );
                }}
                className="w-full bg-[#103f79] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#f3b229] hover:text-[#103f79] transition-all shadow-lg"
              >
                Confirmar WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-[105]"
        />
      )}
    </div>
  );
}
