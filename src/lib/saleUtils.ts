/**
 * Formata o número da Venda no padrão XXXX/AAAA
 * @param saleNumber - Número sequencial da venda
 * @param createdAt - Data de criação da venda
 * @returns Número formatado (ex: 0001/2026)
 */
export function formatSaleNumber(saleNumber: number, createdAt: string): string {
    const year = new Date(createdAt).getFullYear();
    const paddedNumber = saleNumber.toString().padStart(4, '0');
    return `${paddedNumber}/${year}`;
}
