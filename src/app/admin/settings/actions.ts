'use server'
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

// Definimos el tipo de retorno para que TypeScript esté seguro
export async function updateSettings(formData: FormData): Promise<{ success: boolean } | undefined> {
  const margin = parseFloat(formData.get('margin') as string);
  const interest = parseFloat(formData.get('interest') as string);

  if (isNaN(margin) || isNaN(interest)) return { success: false };

  await prisma.globalSettings.upsert({
    where: { id: 1 },
    update: { defaultMargin: margin, defaultCardInterest: interest },
    create: { id: 1, defaultMargin: margin, defaultCardInterest: interest },
  });

  await prisma.product.updateMany({
    data: { baseMargin: margin, cardInterest: interest }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/products');
  revalidatePath('/catalogo');

  return { success: true };
}