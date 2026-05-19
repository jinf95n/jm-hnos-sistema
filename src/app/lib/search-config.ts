export const SEARCH_SYNONYMS: Record<string, string[]> = {
  "fusion": ["fus", "termofusion", "termofusión"],
  "termofusion": ["fus", "fusion", "termofusión"],
  "caño": ["caño", "tubo", "tira"],
  "pulgada": ["\"", "pulg", "1/2", "3/4"],
  "bomba": ["electrobomba", "presurizadora"],
  "valvula": ["valv", "esferica"],
  "termotanque": ["termo", "calefon"],
};

export function expandKeywords(keywords: string[]): string[] {
  let expanded = [...keywords];
  keywords.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (SEARCH_SYNONYMS[lowerWord]) {
      expanded = [...expanded, ...SEARCH_SYNONYMS[lowerWord]];
    }
  });
  return Array.from(new Set(expanded)); // Elimina duplicados
}