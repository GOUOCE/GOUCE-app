/** Formata apenas a apresentação, preservando a placa usada nas requisições. */
export function formatarTituloOnibus(identificacao: string, placa: string): string {
  const normalizada = placa.trim().toUpperCase().replace(/-/g, '');
  const placaExibida = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizada)
    ? `${normalizada.slice(0, 3)}-${normalizada.slice(3)}`
    : placa;
  const nome = identificacao.trim();
  const nomeNormalizado = nome.toUpperCase().replace(/[-\s]/g, '');
  const semApelido = !nome || nomeNormalizado === normalizada || nomeNormalizado === `ÔNIBUS${normalizada}`;
  return `${semApelido ? 'Ônibus' : nome} - ${placaExibida}`;
}
