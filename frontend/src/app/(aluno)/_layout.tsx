import React, { useEffect, useRef } from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, ClipboardList, Megaphone, UserCircle } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';
import { avisoService, AvisoItem } from '@/services/avisoService';

export default function StudentLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const sincronizadoRef = useRef<boolean>(false);
  const ultimoIdVistoRef = useRef<number | undefined>(undefined);
  const idsNotificadosRef = useRef<Set<string>>(new Set());

  const deveMonitorarNotificacoes =
    !isLoading &&
    Boolean(user) &&
    user?.role === 'ALUNO' &&
    (user?.status || '').toLowerCase() !== 'pendente';

  useEffect(() => {
    if (!deveMonitorarNotificacoes) {
      return;
    }

    let ativo = true;

    const verificarNotificacoes = async () => {
      try {
        // 1ª execução ao abrir o app: sincroniza o cursor (high-water mark) sem disparar fila antiga
        if (!sincronizadoRef.current) {
          const iniciais = await avisoService.listarNotificacoes(undefined, 5);
          if (!ativo) return;

          if (Array.isArray(iniciais) && iniciais.length > 0) {
            ultimoIdVistoRef.current = Math.max(...iniciais.map((item) => item.id));
            iniciais.forEach((item) => {
              idsNotificadosRef.current.add(`${item.tipo}-${item.id}`);
            });
          } else {
            ultimoIdVistoRef.current = 0;
          }
          sincronizadoRef.current = true;
          return;
        }

        const lista = await avisoService.listarNotificacoes(
          ultimoIdVistoRef.current,
          5
        );
        if (!ativo || !Array.isArray(lista) || lista.length === 0) {
          return;
        }

        const maiorId = Math.max(...lista.map((item) => item.id));
        if (
          ultimoIdVistoRef.current === undefined ||
          maiorId > ultimoIdVistoRef.current
        ) {
          ultimoIdVistoRef.current = maiorId;
        }

        const novosAvisosParaMural: AvisoItem[] = [];
        let houveNovaNotificacao = false;

        lista.forEach((item) => {
          const chave = `${item.tipo}-${item.id}`;
          if (!idsNotificadosRef.current.has(chave)) {
            idsNotificadosRef.current.add(chave);
            houveNovaNotificacao = true;
            avisoService.dispararNotificacaoSistema(item, () => {
              router.push('/(aluno)/avisos' as any);
            });
            if (item.tipo === 'aviso') {
              novosAvisosParaMural.push({
                id: item.aviso_id ?? item.id,
                titulo: item.titulo,
                descricao: item.mensagem,
                conteudo: item.mensagem,
                data_criacao: item.data_criacao,
              });
            }
          }
        });

        if (houveNovaNotificacao) {
          avisoService.emitirAtualizacaoMural(
            novosAvisosParaMural.length > 0 ? novosAvisosParaMural : undefined
          );
        }
      } catch {
        // Erros silenciosos de rede no polling não devem interromper a sessão do aluno.
      }
    };

    verificarNotificacoes();
    const timer = setInterval(verificarNotificacoes, 5000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [deveMonitorarNotificacoes, router]);

  if (isLoading) {
    return null;
  }

  // Proteção no nível do layout: decide antes de desenhar qualquer tela do grupo
  if (!user) {
    return <Redirect href="/(autenticacao)/login" />;
  }

  if (user.role !== 'ALUNO') {
    return <Redirect href="/acesso-negado" />;
  }

  if ((user.status || '').toLowerCase() === 'pendente') {
    return <Redirect href="/(autenticacao)/cadastro-pendente" />;
  }

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        height: 80,
        paddingBottom: 12,
        backgroundColor: '#F8F9FF',
        borderTopWidth: 1,
        borderTopColor: '#E0E2EC',
      }
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Home size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <ClipboardList size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
          tabBarButton: ({ children, style }) => (
            <View style={style} pointerEvents="none">
              {children}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Megaphone size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <UserCircle size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="editar-perfil"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="alterar-email"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="carteirinha-digital"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="renovar-vinculo"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 64,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#C2E7FF',
  },
});
