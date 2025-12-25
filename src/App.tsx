import { HashRouter, Routes, Route } from 'react-router-dom';

// Por enquanto, criaremos componentes "placeholder" (falsos) 
// só para testar a navegação.
function LoginScreen() {
  return (
    <div style={{ padding: 20 }}>
      <h1>🛡️ Login</h1>
      <p>Tela de autenticação vai aqui.</p>
    </div>
  );
}

function GameScreen() {
  return (
    <div style={{ padding: 20 }}>
      <h1>⚔️ Pomodoro RPG</h1>
      <p>O jogo vai acontecer aqui.</p>
    </div>
  );
}

function App() {
  return (
    // HashRouter é o ideal para Electron (evita erros de carregar arquivos locais)
    <HashRouter>
      <Routes>
        {/* Rota inicial ("/") vai para o Login */}
        <Route path="/" element={<LoginScreen />} />
        
        {/* Rota "/game" será o jogo principal */}
        <Route path="/game" element={<GameScreen />} />
      </Routes>
    </HashRouter>
  );
}

export default App;