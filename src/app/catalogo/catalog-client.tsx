'use client'
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Plus, Minus, MessageCircle, X , Loader2 } from 'lucide-react';
import { saveOrder } from './actions';

export default function CatalogClient({ 
  initialProducts, 
  initialQuery 
}: { 
  initialProducts: any[], 
  initialQuery: string 
}) {
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

    useEffect(() => {
    if (searchTerm === initialQuery) return;
    const delayDebounceFn = setTimeout(() => {
      // startTransition le dice a React: "esto puede tardar, avisame"
      startTransition(() => {
        router.push(`?q=${searchTerm}&page=1`, { scroll: false });
      });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialQuery, router]);

  const addToCart = (product: any) => {
    setCart(prev => ({
      ...prev,
      [product.id]: { ...product, qty: (prev[product.id]?.qty || 0) + 1 }
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId].qty > 1) {
        newCart[productId].qty -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.values(cart).reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartCount = Object.values(cart).reduce((acc, item) => acc + item.qty, 0);

  const sendWhatsApp = async () => {
  // Guardamos en DB primero
  await saveOrder(Object.values(cart), cartTotal);

  // Luego abrimos WhatsApp
  const message = Object.values(cart)
    .map(item => `*${item.qty}* x ${item.name}`)
    .join('\n');
  
  const text = `🚀 *PEDIDO JM HNOS*\n\n${message}\n\n*Total: $${cartTotal.toLocaleString()}*`;
  window.open(`https://wa.me/5492644444444?text=${encodeURIComponent(text)}`, '_blank'); 
};

   return (
    <div className="space-y-6">
      <div className="relative group">
        <input 
          type="text"
          value={searchTerm}
          placeholder="Ej: cable 1.5 rojo"
          className="w-full p-5 pl-14 rounded-3xl border-none shadow-lg focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-medium transition-all outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Si está cargando, mostramos el spinner. Si no, la lupa. */}
        {isPending ? (
          <Loader2 className="absolute left-5 top-5 text-blue-500 animate-spin" size={22} />
        ) : (
          <Search className="absolute left-5 top-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        )}
        
        {searchTerm && !isPending && (
          <button onClick={() => {setSearchTerm(''); startTransition(() => router.push('?page=1'))}} className="absolute right-5 top-5 text-slate-300">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Overlay opaco en los productos mientras carga para dar feedback visual */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {initialProducts.map(product => (
          <div key={product.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
            <div className="flex-1 mr-4">
              <h3 className="font-black text-slate-800 uppercase text-xs sm:text-sm leading-tight mb-1">{product.name}</h3>
              <p className="text-[10px] font-bold text-slate-300 mb-3 tracking-widest uppercase">{product.sku}</p>
              
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black text-slate-900">${product.price.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">3 cuotas sin interés de ${product.valorCuota.toLocaleString()}</span>
                <div className="mt-2 inline-flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-100 w-fit">
                  <span className="text-[10px] font-black text-green-700 uppercase">${product.cashPrice.toLocaleString()} contado</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
              {cart[product.id] ? (
                <>
                  <button onClick={() => removeFromCart(product.id)} className="p-2 text-blue-600 bg-white rounded-xl shadow-sm"><Minus size={18}/></button>
                  <span className="font-black w-6 text-center text-sm">{cart[product.id].qty}</span>
                  <button onClick={() => addToCart(product)} className="p-2 text-blue-600 bg-white rounded-xl shadow-sm"><Plus size={18}/></button>
                </>
              ) : (
                <button 
                  onClick={() => addToCart(product)}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-black transition-all active:scale-95"
                >
                  AGREGAR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Carrito Flotante (Mismo diseño anterior) */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-4 right-4 max-w-md mx-auto bg-slate-900 text-white p-5 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-50">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{cartCount} bultos</p>
            <p className="text-2xl font-black">${cartTotal.toLocaleString()}</p>
          </div>
          <button 
            onClick={sendWhatsApp}
            className="bg-green-500 text-white px-6 py-4 rounded-[1.5rem] font-black flex items-center gap-3 transition-transform active:scale-95"
          >
            <MessageCircle size={22} fill="currentColor" />
            <span className="uppercase text-xs">Enviar Pedido</span>
          </button>
        </div>
      )}
    </div>
  );
}