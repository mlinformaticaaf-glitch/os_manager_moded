/**
 * Formata o código do cliente com o prefixo CLI-
 * @param code - O código numérico do cliente
 * @returns String formatada como "CLI-001" ou null se não houver código
 */
export function formatClientCode(code: number | null | undefined): string | null {
  if (code === null || code === undefined) return null;
  return `CLI-${String(code).padStart(3, '0')}`;
}
