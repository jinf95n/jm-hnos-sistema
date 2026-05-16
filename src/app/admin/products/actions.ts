'use server'
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleProductVisibility(id: string, published: boolean) {
  await prisma.product.update({
    where: { id },
    data: { published }
  });
  revalidatePath('/admin/products');
  revalidatePath('/catalogo');
}