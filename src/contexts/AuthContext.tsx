// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Define o formato dos dados que vamos compartilhar com o app todo
interface AuthContextType {
  user: User | null;      // O usuário logado (ou null se não tiver ninguém)
  loading: boolean;       // Se estamos ainda carregando/verificando o login
}

// Cria o contexto (a "nuvem" de dados)
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Componente que vai "abraçar" o App inteiro para prover esses dados
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Essa função do Firebase fica "escutando" mudanças.
    // Se o usuário logar, deslogar, ou fechar e abrir o app, ela avisa.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Já verificamos, pode parar de carregar
    });

    // Limpa a "escuta" quando o componente morre (boa prática)
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children} 
      {/* Só mostra o App quando terminar de carregar o usuário */}
    </AuthContext.Provider>
  );
}

// Um "gancho" (hook) para facilitar o uso em outros arquivos
// Ao invés de importar useContext e AuthContext, só chamamos useAuth()
export const useAuth = () => useContext(AuthContext);