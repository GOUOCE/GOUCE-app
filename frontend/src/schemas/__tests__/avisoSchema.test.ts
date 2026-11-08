import { describe, it, expect } from '@jest/globals';
import { avisoSchema } from '../avisoSchema';

describe('avisoSchema (HU-023)', () => {
  it('valida e normaliza espaços de um aviso válido', () => {
    const res = avisoSchema.safeParse({
      titulo: '  Alteração de horário   - Linha 02  ',
      descricao: '  A saída passa a ser às 06h30 a partir de segunda-feira.  ',
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.titulo).toBe('Alteração de horário - Linha 02');
      expect(res.data.descricao).toBe(
        'A saída passa a ser às 06h30 a partir de segunda-feira.'
      );
    }
  });

  it('rejeita título e descrição vazios ou preenchidos apenas com espaços', () => {
    const res = avisoSchema.safeParse({
      titulo: '   ',
      descricao: '   ',
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      const mensagens = res.error.issues.map((i) => i.message);
      expect(mensagens).toContain('Título é obrigatório.');
      expect(mensagens).toContain('Descrição é obrigatória.');
    }
  });

  it('rejeita valores menores que 3 caracteres ou maiores que o limite', () => {
    const resCurto = avisoSchema.safeParse({
      titulo: 'Oi',
      descricao: 'Ok',
    });
    expect(resCurto.success).toBe(false);

    const resLongo = avisoSchema.safeParse({
      titulo: 'A'.repeat(151),
      descricao: 'B'.repeat(2001),
    });
    expect(resLongo.success).toBe(false);
  });
});
