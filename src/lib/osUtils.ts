/**
 * Formata o número da OS no padrão XXXX/AAAA
 * @param orderNumber - Número sequencial da OS
 * @param createdAt - Data de criação da OS
 * @returns Número formatado (ex: 0001/2026)
 */
export function formatOSNumber(orderNumber: number, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const paddedNumber = orderNumber.toString().padStart(4, '0');
  return `${paddedNumber}/${year}`;
}
