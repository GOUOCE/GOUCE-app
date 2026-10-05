// Largura média de um caractere na fonte de 16 px dos campos. Valor um pouco
// acima da média real, para a abreviação errar para o lado seguro.
const LARGURA_MEDIA_CARACTERE = 9;

/**
 * Abrevia o texto com "…" para caber em um campo de uma linha.
 *
 * @param largura largura do campo medida com onLayout (0 enquanto não medido)
 * @param espacoReservado espaço ocupado por ícones e margens internas do campo
 */
export function abreviarParaLargura(texto: string, largura: number, espacoReservado: number): string {
  if (!largura) return texto;
  const maximo = Math.max(4, Math.floor((largura - espacoReservado) / LARGURA_MEDIA_CARACTERE));
  return texto.length > maximo ? `${texto.slice(0, maximo - 1).trimEnd()}…` : texto;
}
