// A API guarda a data de nascimento como número AAAAMMDD (ex.: 20050621) ou devolve ISO (2005-06-21).
export function formatarDataNascimento(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null || valor === '') return '';
  const texto = String(valor);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  if (/^\d{8}$/.test(texto)) return `${texto.slice(6, 8)}/${texto.slice(4, 6)}/${texto.slice(0, 4)}`;
  return texto;
}
