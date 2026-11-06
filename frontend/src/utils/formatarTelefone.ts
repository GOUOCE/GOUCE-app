export function formatarTelefone(valor: string | undefined | null): string {
  if (!valor) return '';
  let limpo = valor.replace(/\D/g, '');
  if (limpo.length > 11) limpo = limpo.slice(0, 11);
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 3)} ${limpo.slice(3, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  if (limpo.length > 2) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  }
  if (limpo.length > 0) {
    return `(${limpo}`;
  }
  return '';
}

// Máscara do celular usada no cadastro: (88) 9 9999-9999
export function formatarCelular(valor: string | undefined | null): string {
  return formatarTelefone(valor);
}
