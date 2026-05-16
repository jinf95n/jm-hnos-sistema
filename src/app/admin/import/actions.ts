'use server'
import * as XLSX from 'xlsx';
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from 'next/cache';

// Función genérica de procesamiento ultra rápido
async function fastSync(providerName: string, items: {sku: string, name: string, price: number}[], category: string) {
  const provider = await prisma.provider.findUnique({ where: { name: providerName } });
  if (!provider) throw new Error(`Proveedor ${providerName} no encontrado`);

  console.log(`🚀 Sincronizando ${items.length} productos de ${providerName}...`);

  // 1. Obtener todos los productos actuales de este proveedor para comparar
  const existingProviderProducts = await prisma.providerProduct.findMany({
    where: { providerId: provider.id },
    select: { providerSku: true, providerPrice: true }
  });

  const dbMap = new Map(existingProviderProducts.map(p => [p.providerSku, p.providerPrice]));

  // 2. Filtrar solo los que son NUEVOS o CAMBIARON de precio
  const toUpdate = items.filter(item => dbMap.has(item.sku) && dbMap.get(item.sku) !== item.price);
  const toCreate = items.filter(item => !dbMap.has(item.sku));

  console.log(`📊 ${toCreate.length} nuevos, ${toUpdate.length} actualizaciones.`);

  // 3. Procesar en lotes de 100 para no saturar la conexión
  const batchSize = 100;

  // Lote de Creación
  for (let i = 0; i < toCreate.length; i += batchSize) {
    const batch = toCreate.slice(i, i + batchSize);
    await Promise.all(batch.map(item => 
      prisma.product.upsert({
        where: { internalSku: item.sku },
        update: { name: item.name },
        create: { internalSku: item.sku, name: item.name, category, published: true }
      }).then(() => 
        prisma.providerProduct.create({
          data: { providerSku: item.sku, providerPrice: item.price, providerId: provider.id, productId: item.sku }
        })
      )
    ));
  }

  // Lote de Actualización (Mucho más rápido)
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    await Promise.all(batch.map(item => 
      prisma.providerProduct.update({
        where: { providerId_providerSku: { providerId: provider.id, providerSku: item.sku } },
        data: { providerPrice: item.price }
      })
    ));
  }

  revalidatePath('/admin');
  return { success: true, count: items.length };
}

export async function importABC(formData: FormData) {
  const file = formData.get('file') as File;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];

  const items = data.map(row => ({
    sku: String(row['sku'] || row['codigo'] || "").trim(),
    name: String(row['prod_descripcion'] || row['descripcion'] || "").trim(),
    price: parseFloat(String(row['prod_precio'] || row['precio'] || "0").replace(/[$. ]/g, '').replace(',', '.'))
  })).filter(i => i.sku && i.price > 0);

  return await fastSync('ABC', items, 'Ferretería');
}

export async function importCarmar(formData: FormData) {
  const file = formData.get('file') as File;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];

  const items = data.map(row => {
    const cleanRow: any = {};
    Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
    
    const sku = String(cleanRow['cod_artic'] || "").trim();
    const desc = String(cleanRow['descrip'] || "").trim();
    const adic = String(cleanRow['desc_adic'] || "").trim();
    const name = adic && adic !== "0" ? `${desc} (${adic})` : desc;
    const price = parseFloat(String(cleanRow['precio'] || "0").replace(/[$. ]/g, '').replace(',', '.'));

    return { sku, name, price };
  }).filter(i => i.sku && i.price > 0);

  return await fastSync('CARMAR', items, 'Electricidad');
}

export async function importFadepaExcel(formData: FormData) {

  try {
  const file = formData.get('file') as File;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Usamos header: 1 para leer por posición y evitar errores de nombres
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  const items = data.map(row => {
    const sku = String(row[1] || "").trim(); // Columna B
    const name = String(row[2] || "").trim(); // Columna C
    const priceRaw = row[6]; // Columna G
    const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw || "0").replace(/[$. ]/g, '').replace(',', '.'));

    return { sku, name, price };
  }).filter(i => i.sku && i.price > 0 && i.sku !== "Producto"); // Filtramos el encabezado

  return await fastSync('FADEPA', items, 'Pinturería');
  } catch (error: any) {
    console.error(error);
    return { 
      success: false, 
      count: 0, 
      error: "Error procesando el Excel de Fadepa. Revisá el formato." 
    };
  }
}

// Mantenemos esta por si querés seguir pegando texto
export async function importFadepaText(text: string) {
  // ... (Tu función de texto anterior si la necesitas, si no podés borrarla)
  return { success: false, error: "Usar importador de Excel" };
}