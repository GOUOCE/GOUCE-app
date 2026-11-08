// A API guarda a data de nascimento como número AAAAMMDD (ex.: 20050621) ou devolve ISO (2005-06-21).
export function formatarDataNascimento(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null || valor === '') return '';
  const texto = String(valor);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  if (/^\d{8}$/.test(texto)) return `${texto.slice(6, 8)}/${texto.slice(4, 6)}/${texto.slice(0, 4)}`;
  return texto;
}

/**
 * Formata a data/hora de publicação de um aviso conforme o protótipo:
 * - "Publicado hoje às 07:30, 01/09/2026"
 * - "Publicado ontem às 18:15, 31/08/2026"
 * - "Publicado anteontem às 09:00, 30/08/2026"
 * - "Publicado às 14:00, 20/08/2026" (para datas anteriores)
 */
export function formatarDataPublicacaoAviso(
  valor: string | Date | undefined | null,
  referencia: Date = new Date()
): string {
  if (!valor) return '';
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const horas = `${pad(data.getHours())}:${pad(data.getMinutes())}`;
  const dataFormatada = `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;

  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const inicioRef = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate()
  );

  const diffDias = Math.round(
    (inicioRef.getTime() - inicioData.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDias === 0) {
    return `Publicado hoje às ${horas}, ${dataFormatada}`;
  }
  if (diffDias === 1) {
    return `Publicado ontem às ${horas}, ${dataFormatada}`;
  }
  if (diffDias === 2) {
    return `Publicado anteontem às ${horas}, ${dataFormatada}`;
  }

  return `Publicado às ${horas}, ${dataFormatada}`;
}
