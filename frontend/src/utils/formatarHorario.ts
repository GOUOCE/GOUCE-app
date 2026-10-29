// Máscara de horário HH:mm: só dígitos, ":" depois dos dois primeiros (#340)
export function formatarHorario(valor: string | undefined | null): string {
  if (!valor) return '';
  const limpo = valor.replace(/\D/g, '').slice(0, 4);
  if (limpo.length <= 2) return limpo;
  return `${limpo.slice(0, 2)}:${limpo.slice(2)}`;
}
