import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/authService';

export type UserRole = 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, senha: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  setUserAndToken: (user: User, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function loadStorageData() {
      const storageUser = await AsyncStorage.getItem('@GOUOCE:user');
      const storageToken = await AsyncStorage.getItem('@GOUOCE:token');

      if (storageUser && storageToken) {
        setUser(JSON.parse(storageUser));
        setToken(storageToken);
      }
      setIsLoading(false);
    }

    loadStorageData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(autenticacao)';
    const isProtected = ['(aluno)', '(representante)', '(administrador)'].includes(firstSegment);

    console.log('[AUTH DEBUG] State:', {
      firstSegment,
      inAuthGroup,
      isProtected,
      userStatus: user?.status,
      userRole: user?.role,
      segments
    });

    if (!user && isProtected) {
      console.log('[AUTH DEBUG] No user and protected route, redirecting to login');
      router.replace('/(autenticacao)/login');
      return;
    }

    if (user) {
      // Se o cadastro está pendente, força a tela de análise (HU-001)
      const isAtPendingScreen = segments.includes('cadastro-pendente');
      if (user.status === 'pendente' && !isAtPendingScreen) {
        console.log('[AUTH DEBUG] User pending, redirecting to status screen');
        router.replace('/(autenticacao)/cadastro-pendente');
        return;
      }

      if (inAuthGroup && user.status === 'ativado') {
        const root = user.role === 'ADMINISTRADOR' ? '/(administrador)/home' :
                     user.role === 'MOTORISTA' ? '/(representante)/home' : '/(aluno)/home';
        console.log('[AUTH DEBUG] User active and in auth group, redirecting to home:', root);
        router.replace(root);
        return;
      }

      const roleMatches = (user.role === 'ADMINISTRADOR' && firstSegment === '(administrador)') ||
                          (user.role === 'MOTORISTA' && firstSegment === '(representante)') ||
                          (user.role === 'ALUNO' && firstSegment === '(aluno)');

      if (isProtected && !roleMatches && user.status === 'ativado') {
        console.log('[AUTH DEBUG] Role mismatch, redirecting to access denied');
        router.replace('/acesso-negado');
      }
    }
  }, [user, segments, isLoading]);

  async function setUserAndToken(userData: User, userToken: string) {
    console.log('[AUTH DEBUG] Saving user and token to storage');
    await AsyncStorage.setItem('@GOUOCE:token', userToken);
    await AsyncStorage.setItem('@GOUOCE:user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  }

  async function signIn(email: string, senha: string) {
    setIsLoading(true);
    console.log('[AUTH DEBUG] Signing in:', email);
    try {
      const response = await authService.login({ email, senha });
      console.log('[AUTH DEBUG] Raw API Response Usuario:', JSON.stringify(response.usuario, null, 2));

      // Mapeamento minucioso
      const userData: User = {
        id: String(response.usuario.id),
        name: response.usuario.nome || response.usuario.nome_completo || 'Usuário',
        email: response.usuario.email,
        role: authService.mapRole(response.usuario.role),
        status: response.usuario.status_cadastro || 'ativado',
        telefone: response.usuario.telefone,
        curso: response.usuario.curso,
        faculdade: response.usuario.faculdade,
        periodo_ingresso: response.usuario.periodo_ingresso,
        turno: response.usuario.turno,
        foto_perfil: response.usuario.foto_perfil,
      };

      console.log('[AUTH DEBUG] Final User Object to be saved:', JSON.stringify(userData, null, 2));

      await setUserAndToken(userData, response.token_acesso);
    } catch (error) {
      console.error('[AUTH DEBUG] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem('@GOUOCE:token');
    await AsyncStorage.removeItem('@GOUOCE:user');
    setUser(null);
    setToken(null);
    router.replace('/(autenticacao)/login');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, setUserAndToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
