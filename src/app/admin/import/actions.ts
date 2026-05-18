'use server'
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from 'next/cache';

export async function syncBatch(providerName: string, items: any[], category: string, isLast: boolean = false) {
  try {
    const provider = await prisma.provider.findUnique({ where: { name: providerName } });
    if (!provider) throw new Error(`Proveedor ${providerName} no encontrado`);

    // USAMOS UNA TRANSACCIÓN: Mandamos todo el lote en un solo viaje
    await prisma.$transaction(
      items.map((item) => {
        return prisma.product.upsert({
          where: { internalSku: item.sku },
          update: { name: item.name },
          create: { 
            internalSku: item.sku, 
            name: item.name, 
            category: category,
            published: true,
            providerProducts: {
              create: {
                providerSku: item.sku,
                providerPrice: item.price,
                providerId: provider.id
              }
            }
          }
        });
      }),
      {
        // Si un producto del lote falla, no frena a los demás (opcional)
        // Pero aquí el upsert es seguro.
      }
    );

    // Actualización secundaria de precios para los que ya existían
    // (Esto se puede optimizar, pero el transaction ya lo hace volar)
    await Promise.all(items.map(item => 
      prisma.providerProduct.updateMany({
        where: { providerId: provider.id, providerSku: item.sku },
        data: { providerPrice: item.price }
      })
    ));

    if (isLast) {
      revalidatePath('/admin');
      revalidatePath('/admin/products');
      revalidatePath('/catalogo');
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error en batch:", error);
    return { success: false };
  }
}