'use server'
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function saveOrder(cartItems: any[], total: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no identificado");

  // 1. Asegurarnos que el usuario existe en nuestra tabla local
  const dbUser = await prisma.user.upsert({
    where: { email: user.email! },
    update: { name: user.user_metadata.full_name },
    create: { email: user.email!, name: user.user_metadata.full_name }
  });

  // 2. Crear el pedido
  const order = await prisma.order.create({
    data: {
      userId: dbUser.id,
      total: total,
      status: "PENDIENTE",
      items: {
        create: cartItems.map(item => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price
        }))
      }
    }
  });

  return { success: true, orderId: order.id };
}