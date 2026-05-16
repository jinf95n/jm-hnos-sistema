export interface PricingResult {
  costoNeto: number;    // Precio de lista prov - descuento prov
  precioContado: number; // Costo neto + tu margen (30%)
  precioWeb: number;     // Precio contado + interés tarjeta (3 cuotas)
  valorCuota: number; // Nueva propiedad
}

export function calculatePrices(
  listaProvider: number,
  descuentoProv: number, // Ejemplo: 14.5
  margenDeseado: number, // Ejemplo: 30
  interesTarjeta: number // Ejemplo: 15
): PricingResult {
  
  // 1. Calcular cuánto te sale a vos realmente
  const costoNeto = listaProvider * (1 - descuentoProv / 100);
  
  // 2. Aplicar tu ganancia (Precio para efectivo/transferencia)
  const precioContado = costoNeto * (1 + margenDeseado / 100);
  
  // 3. Aplicar el recargo de tarjeta (Precio que ve el cliente en 3 cuotas)
  const precioWeb = precioContado * (1 + interesTarjeta / 100);
  const valorCuota = precioWeb / 3; // Dividimos el total por 3

  return {
    costoNeto: Number(costoNeto.toFixed(2)),
    precioContado: Number(precioContado.toFixed(2)),
    precioWeb: Number(precioWeb.toFixed(2)),
    valorCuota: Number(valorCuota.toFixed(2)),
  };
}