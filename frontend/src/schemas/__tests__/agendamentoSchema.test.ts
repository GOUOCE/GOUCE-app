import { agendamentoDiaSchema } from '../agendamentoSchema';

describe('agendamentoDiaSchema - HU-013 Validação de Formulário', () => {

  it('deve validar com sucesso quando ida e volta são Sim e todos os campos estão preenchidos', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: true,
      horarioIda: '05:30:00',
      pontoEmbarqueIda: '1',
      faculdadeDestinoIda: '1',
      rotaComplementarIda: '',
      usaVolta: true,
      horarioVolta: '17:00:00',
      pontoDesembarqueVolta: '1',
      faculdadeOrigemVolta: '1',
      rotaComplementarVolta: '',
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(true);
  });

  it('deve validar com sucesso quando apenas ida é Sim e campos de ida estão preenchidos', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: true,
      horarioIda: '05:30:00',
      pontoEmbarqueIda: '2',
      faculdadeDestinoIda: '1',
      usaVolta: false,
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(true);
  });

  it('deve validar com sucesso quando apenas volta é Sim e campos de volta estão preenchidos', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: false,
      usaVolta: true,
      horarioVolta: '17:00:00',
      pontoDesembarqueVolta: '2',
      faculdadeOrigemVolta: '1',
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(true);
  });

  it('deve recusar quando usaIda é true mas os campos condicionais de ida estão vazios (FA-003)', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: true,
      horarioIda: '',
      pontoEmbarqueIda: '',
      faculdadeDestinoIda: '',
      usaVolta: false,
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(false);

    if (!resultado.success) {
      const msgs = resultado.error.issues.map((i) => i.message);
      expect(msgs).toContain('Selecione o horário de ida');
      expect(msgs).toContain('Selecione o ponto de embarque');
      expect(msgs).toContain('Selecione a faculdade (IES) de destino');
    }
  });

  it('deve recusar quando usaVolta é true mas os campos condicionais de volta estão vazios (FA-003)', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: false,
      usaVolta: true,
      horarioVolta: '',
      pontoDesembarqueVolta: '',
      faculdadeOrigemVolta: '',
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(false);

    if (!resultado.success) {
      const msgs = resultado.error.issues.map((i) => i.message);
      expect(msgs).toContain('Selecione o horário de volta');
      expect(msgs).toContain('Selecione o ponto de desembarque');
      expect(msgs).toContain('Selecione a faculdade (IES) de origem');
    }
  });

  it('deve aceitar quando ambas as opções de ida e volta são Não (nenhum agendamento / remoção)', () => {
    const dados = {
      dataIso: '2026-09-02',
      usaIda: false,
      usaVolta: false,
    };

    const resultado = agendamentoDiaSchema.safeParse(dados);
    expect(resultado.success).toBe(true);
  });
});
