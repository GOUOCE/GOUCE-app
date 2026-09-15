import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';

// Tipagem do usuário baseada na arquitetura (Seção 4.1)
export type UserRole = 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Proteção de rotas baseada no estado de autenticação
  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(autenticacao)';

    // Identifica se está em uma rota protegida
    const isProtected = ['(aluno)', '(representante)', '(administrador)'].includes(firstSegment);

    if (!user && isProtected) {
      // Se não está logado e tenta acessar rota protegida, vai para login
      router.replace('/(autenticacao)/login');
      return;
    }

    if (user) {
      if (inAuthGroup) {
        // Se logado e em rota de auth, manda para sua home
        const root = user.role === 'ADMINISTRADOR' ? '/(administrador)/home' :
                     user.role === 'MOTORISTA' ? '/(representante)/home' : '/(aluno)/home';
        router.replace(root);
        return;
      }

      // Validação de Perfil vs Rota
      const roleMatches = (user.role === 'ADMINISTRADOR' && firstSegment === '(administrador)') ||
                          (user.role === 'MOTORISTA' && firstSegment === '(representante)') ||
                          (user.role === 'ALUNO' && firstSegment === '(aluno)');

      if (isProtected && !roleMatches) {
        // Se logado mas em rota errada, manda para acesso negado
        router.replace('/acesso-negado');
      }
    }
  }, [user, segments, isLoading]);

  async function signIn(email: string, role: UserRole) {
    setIsLoading(true);
    try {
      // Logins Mockados para Teste
      let mockUser: User | null = null;

      if (email === 'admin@gouoce.com') {
        mockUser = { id: '1', name: 'Admin Master', email, role: 'ADMINISTRADOR' };
      } else if (email === 'aluno@gouoce.com') {
        mockUser = { id: '2', name: 'João Aluno', email, role: 'ALUNO' };
      } else {
        // Fallback para qualquer outro email usando o role selecionado na UI
        mockUser = {
          id: Math.random().toString(),
          name: 'Usuário de Teste',
          email,
          role,
        };
      }

      setUser(mockUser);
      setToken('fake-jwt-token');
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setUser(null);
    setToken(null);
    router.replace('/(autenticacao)/login');
  }

  useEffect(() => {
    // Lógica para carregar token salvo do storage ao iniciar o app
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
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
