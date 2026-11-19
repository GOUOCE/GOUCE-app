import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { avisoService } from '../avisoService';
import { api } from '../../api/api';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif-id-1')),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
  AndroidNotificationPriority: { MAX: 'max' },
}));

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('avisoService (HU-023)', () => {
  const mockedGet = api.get as jest.MockedFunction<typeof api.get>;
  const mockedPost = api.post as jest.MockedFunction<typeof api.post>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista avisos e filtra por título quando busca é informada', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 2,
          titulo: 'Alteração de horário - Linha 02',
          descricao: 'Saída às 06h30.',
          autor_id: 1,
          data_criacao: '2026-09-01T07:30:00Z',
        },
        {
          id: 1,
          titulo: 'Manutenção preventiva no Ônibus 02',
          descricao: 'Ônibus 02 em manutenção.',
          autor_id: 1,
          data_criacao: '2026-08-31T18:15:00Z',
        },
      ],
    } as any);

    const resultado = await avisoService.listarAvisos('manutenção');

    expect(mockedGet).toHaveBeenCalledWith('/avisos', {
      params: { titulo: 'manutenção' },
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].titulo).toBe('Manutenção preventiva no Ônibus 02');
  });

  it('cria um novo aviso limpando espaços excedentes', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Aviso publicado com sucesso.',
        data: {
          id: 10,
          titulo: 'Reajuste no ponto de embarque',
          descricao: 'O ponto de embarque da Linha 02 foi reajustado.',
          autor_id: 42,
          data_criacao: '2026-09-01T09:00:00Z',
        },
      },
    } as any);

    const criado = await avisoService.criarAviso(
      '  Reajuste no   ponto de embarque ',
      '  O ponto de embarque da Linha 02 foi reajustado. '
    );

    expect(mockedPost).toHaveBeenCalledWith('/avisos', {
      titulo: 'Reajuste no ponto de embarque',
      descricao: 'O ponto de embarque da Linha 02 foi reajustado.',
    });
    expect(criado.id).toBe(10);
    expect(criado.titulo).toBe('Reajuste no ponto de embarque');
  });

  it('lista notificacoes recentes com parametro apos_id e nome do app GOUOCE (HU-024)', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 5,
          tipo: 'aviso',
          app_nome: 'GOUOCE',
          titulo: 'Alteração de horário',
          mensagem: 'A saída da rota Linha 02 passa a ser às 06h30.',
          aviso_id: 5,
          data_criacao: '2026-09-01T07:30:00Z',
        },
      ],
    } as any);

    const notificacoes = await avisoService.listarNotificacoes(4, 2);

    expect(mockedGet).toHaveBeenCalledWith('/avisos/notificacoes', {
      params: { apos_id: 4, limite: 2 },
    });
    expect(notificacoes).toHaveLength(1);
    expect(notificacoes[0].app_nome).toBe('GOUOCE');
    expect(notificacoes[0].titulo).toBe('Alteração de horário');
  });

  it('dispara notificacao nativa do sistema com nome GOUOCE e icone do app (HU-024)', () => {
    const mockNotificationCtor = jest.fn();
    (mockNotificationCtor as any).permission = 'granted';
    const originalNotification = (globalThis as any).Notification;
    (globalThis as any).Notification = mockNotificationCtor;

    try {
      const disparou = avisoService.dispararNotificacaoSistema({
        id: 7,
        tipo: 'aviso',
        app_nome: 'GOUOCE',
        titulo: 'Alteração de horário',
        mensagem: 'Saída às 06h30.',
        aviso_id: 7,
        data_criacao: '2026-09-01T07:30:00Z',
      });

      expect(disparou).toBe(true);
      expect(mockNotificationCtor).toHaveBeenCalledWith(
        'GOUOCE • Alteração de horário',
        expect.objectContaining({
          body: 'Saída às 06h30.',
          icon: expect.stringMatching(/^data:image\//),
          badge: expect.stringMatching(/^data:image\//),
        })
      );
    } finally {
      (globalThis as any).Notification = originalNotification;
    }
  });

  it('dispara notificacao nativa local via expo-notifications quando Web Notification API nao existe (HU-024)', async () => {
    const originalNotification = (globalThis as any).Notification;
    delete (globalThis as any).Notification;

    try {
      const disparou = avisoService.dispararNotificacaoSistema({
        id: 8,
        tipo: 'aviso',
        app_nome: 'GOUOCE',
        titulo: 'Aviso nativo mobile',
        mensagem: 'Saída da Linha 01 confirmada.',
        aviso_id: 8,
        data_criacao: '2026-11-18T21:40:00Z',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(disparou).toBe(true);
      const handlerCall = (Notifications.setNotificationHandler as jest.Mock).mock
        .calls[0]?.[0] as Notifications.NotificationHandler | undefined;
      expect(handlerCall).toBeDefined();
      const behavior = await handlerCall!.handleNotification({} as Notifications.Notification);
      expect(behavior).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'GOUOCE • Aviso nativo mobile',
          body: 'Saída da Linha 01 confirmada.',
          sound: true,
          priority: 'max',
          data: {
            id: 8,
            tipo: 'aviso',
            aviso_id: 8,
          },
        },
        trigger: null,
      });
    } finally {
      (globalThis as any).Notification = originalNotification;
    }
  });

  it('mantem permissao e disparo nativo mesmo quando setNotificationChannelAsync falha no Android (HU-024)', async () => {
    const originalNotification = (globalThis as any).Notification;
    const originalOsDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    delete (globalThis as any).Notification;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    (Notifications.setNotificationChannelAsync as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('NullPointerException'))
    );

    try {
      const permissaoOk = await avisoService.configurarPermissoesNotificacaoNativa();
      const disparou = avisoService.dispararNotificacaoSistema({
        id: 9,
        tipo: 'aviso',
        app_nome: 'GOUOCE',
        titulo: 'Aviso resiliente Android',
        mensagem: 'Canal falhou mas notificacao local segue.',
        aviso_id: 9,
        data_criacao: '2026-11-18T21:45:00Z',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(permissaoOk).toBe(true);
      expect(disparou).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'GOUOCE • Aviso resiliente Android',
          body: 'Canal falhou mas notificacao local segue.',
          sound: true,
          priority: 'max',
          data: {
            id: 9,
            tipo: 'aviso',
            aviso_id: 9,
          },
        },
        trigger: null,
      });
    } finally {
      (globalThis as any).Notification = originalNotification;
      (Notifications.setNotificationChannelAsync as jest.Mock).mockImplementation(() =>
        Promise.resolve()
      );
      if (originalOsDescriptor) {
        Object.defineProperty(Platform, 'OS', originalOsDescriptor);
      } else {
        delete (Platform as any).OS;
      }
    }
  });
});
