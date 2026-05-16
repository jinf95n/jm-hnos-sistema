'use server'
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function importFadepaText(text: string) {
  try {
    // Buscamos el proveedor FADEPA (asegurate de haberlo creado en el seed)
    const provider = await prisma.provider.findUnique({ where: { name: 'FADEPA' } });
    if (!provider) throw new Error("Proveedor FADEPA no encontrado");

    // Expresión regular para detectar el patrón: Código - Descripción - Precio Lista - Precio IVA
    // Ejemplo: 101 BALDE X 4 L (BLANCO) 4 5.903,38 7143,09
    const regex = /^(\d+[\w-]*)\s+(.*?)\s+[\d,.]+\s+([\d,.]+)\s+[\d,.]+$/gm;
    
    let match;
    let count = 0;
    const products = [];

    while ((match = regex.exec(text)) !== null) {
      const sku = match[1];
      const name = match[2];
      const price = parseFloat(match[3].replace('.', '').replace(',', '.'));

      if (sku && name && !isNaN(price)) {
        products.push({ sku, name, price });
      }
    }

    // Cargamos los productos en la base de datos
    for (const item of products) {
      await prisma.product.upsert({
        where: { internalSku: item.sku },
        update: {
          name: item.name,
          providerProducts: {
            upsert: {
              where: { providerId_providerSku: { providerId: provider.id, providerSku: item.sku } },
              update: { providerPrice: item.price },
              create: { providerSku: item.sku, providerPrice: item.price, providerId: provider.id }
            }
          }
        },
        create: {
          internalSku: item.sku,
          name: item.name,
          category: 'Pinturería',
          providerProducts: {
            create: { providerSku: item.sku, providerPrice: item.price, providerId: provider.id }
          }
        }
      });
      count++;
    }

    revalidatePath('/');
    return { success: true, count };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}