import React from 'react';
import renderer from 'react-test-renderer';
import MeusAgendamentosScreen from '../agenda';
import { agendamentoService } from '@/services/agendamentoService';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('@/services/agendamentoService', () => ({
  agendamentoService: {
    listarAgendamentosAtivos: jest.fn(),
    cancelarAgendamento: jest.fn(),
  },
}));

jest.mock('@/components/ui/AppPopup', () => ({
  AppPopup: (props: any) => jest.requireActual<typeof React>('react').createElement('Popup', props),
}));

describe('HU-014 - Tela Meus Agendamentos (Agenda)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a tela de Meus Agendamentos com o título principal e contador de ativos', async () => {
    (agendamentoService.listarAgendamentosAtivos as jest.Mock).mockResolvedValueOnce([
      { idAgendamento: '1', dataIso: '2026-08-31', usaIda: true, usaVolta: true },
      { idAgendamento: '2', dataIso: '2026-09-01', usaIda: true, usaVolta: true },
    ]);

    let tree: any;
    await renderer.act(async () => {
      tree = renderer.create(<MeusAgendamentosScreen />);
    });

    const root = tree.root;
    const titulos = root.findAllByType('Text').map((t: any) => t.props.children);
    expect(titulos).toContain('Meus agendamentos');
  });

  it('deve exibir o estado vazio quando não houver agendamentos futuros (FA-001 / Critério 2)', async () => {
    (agendamentoService.listarAgendamentosAtivos as jest.Mock).mockResolvedValueOnce([]);

    let tree: any;
    await renderer.act(async () => {
      tree = renderer.create(<MeusAgendamentosScreen />);
    });

    const root = tree.root;
    const textos = root.findAllByType('Text').map((t: any) => t.props.children);
    expect(textos).toContain('Você ainda não possui agendamentos futuros.');
  });
});
