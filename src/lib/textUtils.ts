// Conjunções e preposições que não devem ser capitalizadas (exceto no início)
const LOWERCASE_WORDS = new Set([
  'e', 'ou', 'de', 'da', 'do', 'das', 'dos', 
  'em', 'na', 'no', 'nas', 'nos',
  'a', 'o', 'as', 'os', 'ao', 'aos', 'à', 'às',
  'para', 'por', 'pela', 'pelo', 'pelas', 'pelos',
  'com', 'sem', 'sob', 'sobre',
  'que', 'se', 'mas', 'porém', 'contudo',
  'um', 'uma', 'uns', 'umas',
  'entre', 'até', 'após', 'desde',
]);

/**
 * Capitaliza a primeira letra de cada palavra, exceto conjunções e preposições
 * (a menos que seja a primeira palavra da frase)
 */
export function capitalizeWords(text: string): string {
  if (!text) return text;
  
  return text
    .split(' ')
    .map((word, index) => {
      if (!word) return word;
      
      const lowerWord = word.toLowerCase();
      
      // Primeira palavra sempre capitalizada
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Conjunções e preposições ficam em minúsculo
      if (LOWERCASE_WORDS.has(lowerWord)) {
        return lowerWord;
      }
      
      // Outras palavras são capitalizadas
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Handler para onChange de inputs que aplica capitalização
 */
export function handleCapitalizeChange(
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
): void {
  const cursorPosition = e.target.selectionStart || 0;
  const originalLength = e.target.value.length;
  
  e.target.value = capitalizeWords(e.target.value);
  
  const newLength = e.target.value.length;
  const newCursorPosition = cursorPosition + (newLength - originalLength);
  
  onChange(e);
  
  // Restaurar posição do cursor após a transformação
  requestAnimationFrame(() => {
    e.target.setSelectionRange(newCursorPosition, newCursorPosition);
  });
}
