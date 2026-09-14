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
    const inProtectedGroup = firstSegment === '(driver)' || firstSegment === '(student)';
    const inAuthGroup = firstSegment === '(auth)';

    console.log('[DEBUG] AuthContext:', {
      segments,
      firstSegment,
      inProtectedGroup,
      inAuthGroup,
      hasUser: !!user
    });

    if (!user && inProtectedGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      const root = user.role === 'MOTORISTA' ? '/(driver)/home' : '/(student)/home';
      router.replace(root);
    }
  }, [user, segments, isLoading]);

  async function signIn(email: string, role: UserRole) {
    setIsLoading(true);
    try {
      // Simulação de chamada de API (HU-002)
      // Futuramente aqui será usado o Axios para chamar /auth/login
      const mockUser: User = {
        id: '1',
        name: 'Usuário de Teste',
        email,
        role,
      };

      setUser(mockUser);
      setToken('fake-jwt-token');
      // Salvar token no storage futuramente
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setUser(null);
    setToken(null);
    // Limpar storage futuramente
    router.replace('/(auth)/login');
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
