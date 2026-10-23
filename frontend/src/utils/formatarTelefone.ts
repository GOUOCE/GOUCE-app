export function formatarTelefone(valor: string | undefined | null): string {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length === 11) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
  }
  if (apenasNumeros.length === 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return valor;
}

// Máscara do celular usada no cadastro do aluno: (88) 9 9999-9999
export function formatarCelular(valor: string | undefined | null): string {
  let limpo = (valor || '').replace(/\D/g, '');
  if (limpo.length > 11) limpo = limpo.slice(0, 11);
  if (limpo.length <= 2) return limpo ? `(${limpo}` : '';
  if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 3)} ${limpo.slice(3, 7)}-${limpo.slice(7)}`;
}
