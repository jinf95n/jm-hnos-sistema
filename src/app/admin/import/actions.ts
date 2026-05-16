'use server'
import * as XLSX from 'xlsx';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function importABC(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No hay archivo");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet) as any[];

    const provider = await prisma.provider.findUnique({ 
      where: { name: 'ABC' },
      include: { products: true } 
    });
    if (!provider) throw new Error("Proveedor no encontrado");

    console.log(`🚀 Sincronizando ${excelData.length} productos de ABC...`);

    // 1. Mapear productos del Excel a un formato limpio
    const excelProducts = new Map();
    excelData.forEach(row => {
      const cleanRow: any = {};
      Object.keys(row).forEach(k => cleanRow[k.toLowerCase().trim()] = row[k]);
      
      const sku = String(cleanRow['sku'] || cleanRow['codigo'] || "").trim();
      const name = String(cleanRow['prod_descripcion'] || cleanRow['descripcion'] || "").trim();
      const priceRaw = cleanRow['prod_precio'] || cleanRow['precio'] || 0;
      
      let price = 0;
      if (typeof priceRaw === 'number') price = priceRaw;
      else price = parseFloat(String(priceRaw).replace(/[$. ]/g, '').replace(',', '.'));

      if (name && price > 0) {
        const finalSku = sku === "" ? `ID-${name.substring(0, 15).replace(/\s+/g, '-')}` : sku;
        excelProducts.set(finalSku, { name, price });
      }
    });

    // 2. Traer productos actuales de la DB para comparar
    const currentProviderProducts = await prisma.providerProduct.findMany({
      where: { providerId: provider.id }
    });

    const dbProductsMap = new Map(
      currentProviderProducts.map(p => [p.providerSku, p.providerPrice])
    );

    // 3. Identificar cambios (solo lo que realmente cambió)
    const toUpdate = [];
    const toCreate = [];

    for (const [sku, data] of excelProducts.entries()) {
      if (dbProductsMap.has(sku)) {
        if (dbProductsMap.get(sku) !== data.price) {
          toUpdate.push({ sku, price: data.price, name: data.name });
        }
      } else {
        toCreate.push({ sku, price: data.price, name: data.name });
      }
    }

    console.log(`📊 Reporte: ${toCreate.length} nuevos, ${toUpdate.length} cambios de precio.`);

    // 4. Ejecutar cambios en lotes (Batch)
    if (toCreate.length > 0) {
      console.log("Creating new products...");
      for (const item of toCreate) {
        await prisma.product.upsert({
          where: { internalSku: item.sku },
          update: { name: item.name },
          create: { 
            internalSku: item.sku, 
            name: item.name, 
            category: 'Varios'
          }
        });
        await prisma.providerProduct.create({
          data: {
            providerSku: item.sku,
            providerPrice: item.price,
            providerId: provider.id,
            productId: item.sku // Asumiendo que usamos SKU como ID interno
          }
        });
      }
    }

    if (toUpdate.length > 0) {
      console.log("Updating prices...");
      // Actualizamos precios de forma masiva
      for (const item of toUpdate) {
        await prisma.providerProduct.update({
          where: { 
            providerId_providerSku: { 
              providerId: provider.id, 
              providerSku: item.sku 
            } 
          },
          data: { providerPrice: item.price }
        });
      }
    }

    // 5. (OPCIONAL) ¿Qué pasa con los que NO están en el Excel?
    // Podríamos desactivarlos, pero por ahora los dejamos.

    console.log("✅ Sincronización terminada.");
    revalidatePath('/');
    return { success: true, count: excelProducts.size };

  } catch (error) {
    console.error("❌ Error:", error);
    return { success: false, error: "Error en la sincronización" };
  }
}

export async function importCarmar(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No hay archivo");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet) as any[];

    const provider = await prisma.provider.findUnique({ where: { name: 'CARMAR' } });
    if (!provider) throw new Error("Proveedor CARMAR no encontrado");

    console.log(`🚀 Sincronizando CARMAR: ${excelData.length} filas...`);

    const validRows = excelData.map(row => {
      // 1. Normalizamos las llaves de la fila (pasamos a minúsculas y quitamos espacios)
      const cleanRow: any = {};
      Object.keys(row).forEach(k => {
        const cleanKey = k.trim().toLowerCase();
        cleanRow[cleanKey] = row[k];
      });

      // 2. Extraemos los datos usando los encabezados reales de CARMAR
      // COD_ARTIC -> sku | DESCRIP -> name | DESC_ADIC -> info extra/marca | PRECIO -> price
      const sku = String(cleanRow['cod_artic'] || "").trim();
      const desc = String(cleanRow['descrip'] || "").trim();
      const adicional = String(cleanRow['desc_adic'] || "").trim();
      const priceRaw = cleanRow['precio'] || 0;

      // 3. Limpieza de precio (maneja números o strings con formato argentino)
      let price = 0;
      if (typeof priceRaw === 'number') {
        price = priceRaw;
      } else {
        // Quitamos $, puntos de miles y cambiamos coma por punto decimal
        const cleanPrice = String(priceRaw).replace(/[$. ]/g, '').replace(',', '.');
        price = parseFloat(cleanPrice);
      }

      // 4. Formateamos el nombre: "DESCRIPCION (INFORMACION ADICIONAL)"
      const fullName = adicional && adicional !== "0" 
        ? `${desc} (${adicional})` 
        : desc;

      return { sku, name: fullName, price };
    }).filter(r => r.name !== "" && r.price > 0 && r.sku !== "");

    // Procesar en lotes de 100 para velocidad
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      await prisma.$transaction(
        batch.map((item) => 
          prisma.product.upsert({
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
              category: 'Ferretería General',
              providerProducts: {
                create: { providerSku: item.sku, providerPrice: item.price, providerId: provider.id }
              }
            }
          })
        )
      );
    }

    revalidatePath('/');
    return { success: true, count: validRows.length };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error en CARMAR" };
  }
}

export async function importFadepaText(text: string) {
  try {
    const provider = await prisma.provider.findUnique({ where: { name: 'FADEPA' } });
    if (!provider) throw new Error("Proveedor FADEPA no encontrado. Ejecutá el seed.");

    // Buscamos líneas que tengan: Código (nros y letras) + Nombre + Precio (con puntos/comas)
    // Este Regex está adaptado al formato que me pasaste en la captura de FADEPA
    const lines = text.split('\n');
    let processedCount = 0;

    for (const line of lines) {
      // Intentamos capturar el patrón: SKU (al principio) - Nombre - Precio - Precio IVA
      // Ejemplo: 101 BALDE X 4 L (BLANCO) 4 5.903,38 7143,09
      const match = line.match(/^(\d+[\w-]*)\s+(.*?)\s+[\d,.]+\s+([\d,.]+)\s+[\d,.]+$/);
      
      if (match) {
        const sku = match[1].trim();
        const name = match[2].trim();
        const price = parseFloat(match[3].replace('.', '').replace(',', '.'));

        if (sku && name && !isNaN(price)) {
          await prisma.product.upsert({
            where: { internalSku: sku },
            update: {
              name: name,
              providerProducts: {
                upsert: {
                  where: { providerId_providerSku: { providerId: provider.id, providerSku: sku } },
                  update: { providerPrice: price },
                  create: { providerSku: sku, providerPrice: price, providerId: provider.id }
                }
              }
            },
            create: {
              internalSku: sku,
              name: name,
              category: 'Pinturería',
              providerProducts: {
                create: { providerSku: sku, providerPrice: price, providerId: provider.id }
              }
            }
          });
          processedCount++;
        }
      }
    }

    revalidatePath('/');
    return { success: true, count: processedCount };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error procesando texto de Fadepa" };
  }
}

export async function importFadepaExcel(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No hay archivo");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Importante: Empezamos a leer desde la fila 1 (donde están los encabezados reales)
    const excelData = XLSX.utils.sheet_to_json(sheet) as any[];

    const provider = await prisma.provider.findUnique({ where: { name: 'FADEPA' } });
    if (!provider) throw new Error("Proveedor FADEPA no encontrado");

    const validRows = excelData.map(row => {
      // Mapeo según tu captura: Producto (SKU), Nombre (DESC), L. Precio SJ (PRECIO)
      const sku = String(row['Producto'] || "").trim();
      const name = String(row['Nombre'] || "").trim();
      const priceRaw = row['L. Precio SJ'] || 0;
      
      let price = 0;
      if (typeof priceRaw === 'number') price = priceRaw;
      else price = parseFloat(String(priceRaw).replace(/[$. ]/g, '').replace(',', '.'));

      // CÁLCULO DE DESCUENTO EN CASCADA (12% + 15% + 10%)
      // Esto equivale a multiplicar por 0.88 * 0.85 * 0.90
      const netoFadepa = price * 0.88 * 0.85 * 0.90;
      
      // Como nuestro sistema ya aplica un "baseDiscount", vamos a "engañarlo" un poco 
      // para que el resultado final sea este neto. Seteamos el precio de lista 
      // ya con el descuento en cascada aplicado para que sea más simple.
      return { sku, name, price: netoFadepa };
    }).filter(r => r.name !== "" && r.price > 0 && r.sku !== "");

    // Carga masiva en bloques de 100
    const batchSize = 100;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map((item) => 
          prisma.product.upsert({
            where: { internalSku: item.sku },
            update: {
              name: item.name,
              providerProducts: {
                upsert: {
                  where: { providerId_providerSku: { providerId: provider.id, providerSku: item.sku } },
                  // Aquí guardamos el precio YA NETO (cascada aplicada)
                  // Entonces en el seed pondremos 0% para FADEPA.
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
          })
        )
      );
    }

    revalidatePath('/');
    return { success: true, count: validRows.length };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error en FADEPA" };
  }
}