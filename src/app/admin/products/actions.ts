'use server'
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProductMargin(id: string, margin: number | null) {
  try {
    await prisma.product.update({
      where: { id },
      data: { customMargin: margin }
    });

    // REVALIDACIÓN TOTAL: Esto limpia el caché del servidor
    revalidatePath('/admin/products');
    revalidatePath('/catalogo');
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function toggleProductVisibility(id: string, published: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { published }
    });
    revalidatePath('/admin/products');
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}