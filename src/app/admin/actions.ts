'use server'
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteOrder(id: string) {
  try {
    // 1. Borramos primero todos los ítems que pertenecen a esa orden
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    // 2. Ahora que la orden está vacía, la podemos borrar
    await prisma.order.delete({
      where: { id }
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error al borrar orden:", error);
    return { success: false };
  }
}

export async function markAsVendido(id: string) {
  try {
    await prisma.order.update({
      where: { id },
      data: { status: 'VENDIDO' }
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error al marcar como vendido:", error);
    return { success: false };
  }
}