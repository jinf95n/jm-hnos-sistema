export function calculatePrices(
  listaProvider: number,
  descuentoProv: number,
  baseMargin: number,
  cardInterest: number,
  customMargin: number | null
) {
  const costoNeto = listaProvider * (1 - descuentoProv / 100);
  const margenFinal = customMargin !== null ? customMargin : baseMargin;
  
  const precioContado = costoNeto * (1 + margenFinal / 100);
  const precioWeb = precioContado * (1 + cardInterest / 100);

  return {
    costoNeto,
    precioContado,
    precioWeb,
    valorCuota: precioWeb / 3
  };
}