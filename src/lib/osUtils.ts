/**
 * Formata o número da OS com padding de 4 dígitos (muda para 5+ quando necessário)
 * @param orderNumber - Número sequencial da OS
 * @param createdAt - Data de criação da OS (não usado mais, mantido para compatibilidade)
 * @returns Número formatado (ex: 0001, 1696, 10000)
 */
export function formatOSNumber(orderNumber: number, createdAt: string): string {
  const paddedNumber = orderNumber.toString().padStart(4, '0');
  return paddedNumber;
}
