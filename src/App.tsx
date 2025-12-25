// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { GameWrapper } from './pages/GameWrapper';

// Componente Especial: Rota Protegida
// Se não tiver usuário logado, chuta ele de volta pro Login
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/game" 
            element={
              <PrivateRoute>
                <GameWrapper />
              </PrivateRoute>
            } 
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;