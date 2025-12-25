// src/pages/Login.tsx
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Envelope, LockKey, GameController } from 'phosphor-react';

export function Login() {
  // Estados para controlar o que o usuário digita
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Alterna entre Login e Cadastro
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // Usado para trocar de tela

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/game');
      
    } catch (err) {
      console.error(err);
      
      // CORREÇÃO:
      // Tratamos 'err' como um objeto que PODE ter uma propriedade 'code' (string)
      const firebaseError = err as { code?: string; message?: string };

      if (firebaseError.code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (firebaseError.code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (firebaseError.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else if (firebaseError.code === 'auth/weak-password') setError('A senha deve ter 6+ caracteres.');
      else setError('Erro ao conectar. Tente novamente.');
    }
  }

  return (
    <div style={{ 
      height: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', background: '#121214' 
    }}>
      
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <GameController size={64} color="#8257e5" weight="duotone" />
        <h1>Pomodoro RPG</h1>
      </div>

      <form onSubmit={handleAuth} style={{ 
        display: 'flex', flexDirection: 'column', gap: '15px', 
        width: '300px', padding: '30px', background: '#202024', borderRadius: '8px' 
      }}>
        
        <h2 style={{ margin: 0, textAlign: 'center' }}>
          {isRegistering ? 'Criar Conta' : 'Acessar Portal'}
        </h2>

        {error && <span style={{ color: '#f75a68', fontSize: '14px' }}>{error}</span>}

        {/* Input de Email */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#121214', padding: '10px', borderRadius: '4px' }}>
          <Envelope size={20} color="#7c7c8a" />
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '10px', width: '100%', outline: 'none' }}
          />
        </div>

        {/* Input de Senha */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#121214', padding: '10px', borderRadius: '4px' }}>
          <LockKey size={20} color="#7c7c8a" />
          <input 
            type="password" 
            placeholder="Sua senha secreta" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '10px', width: '100%', outline: 'none' }}
          />
        </div>

        {/* Botão de Ação */}
        <button type="submit" style={{ 
          padding: '12px', background: '#8257e5', color: 'white', border: 'none', 
          borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px',
          marginTop: '10px'
        }}>
          {isRegistering ? 'Cadastrar Aventureiro' : 'Entrar'}
        </button>

      </form>

      <button 
        onClick={() => setIsRegistering(!isRegistering)}
        style={{ background: 'none', border: 'none', color: '#8257e5', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {isRegistering ? 'Já tenho conta? Fazer login' : 'Não tem conta? Crie uma agora'}
      </button>
    </div>
  );
}