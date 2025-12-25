// src/pages/GameWrapper.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCharacter, addReward } from '../services/characterService'; // Importamos o addReward
import { Character, Quest } from '../types';
import { CreateCharacter } from './CreateCharacter';
import { QuestBoard } from '../components/QuestBoard';
import { ActiveQuest } from '../components/ActiveQuest';
import { CircleNotch } from 'phosphor-react';
import { ProgressBar } from '../components/ProgressBar';
import { completeQuest } from '../services/questService'; // Adicione ao import existente

export function GameWrapper() {
  const { user } = useAuth();
  
  // Estados para gerenciar os dados do jogo
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Guarda a missão que está sendo jogada agora.
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  // Função para buscar os dados do personagem no banco
  const fetchCharacter = async () => {
    if (!user) return;
    try {
      const charData = await getCharacter(user.uid);
      setCharacter(charData);
    } catch (error) {
      console.error("Erro ao buscar personagem", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacter();
  }, [user]);

  // --- HANDLERS (Funções de Ação) ---

  // Chamado quando o timer chega a zero
  const handleQuestComplete = async () => {
    // Verificação de segurança: precisa ter user, quest ativa e a quest precisa ter ID
    if (!user || !activeQuest || !activeQuest.id) return;

    try {
      // 1. Calcula XP e Ouro
      const reward = await addReward(user.uid, activeQuest.durationMinutes);
      
      // 2. ATUALIZAÇÃO NOVA: Marca a quest como concluída no banco
      await completeQuest(user.uid, activeQuest.id);

      // 3. Mensagem de Vitória
      let mensagem = `🎉 Missão Cumprida!\n\nVocê ganhou:\n✨ +${reward.xpGained} XP\n💰 +${reward.goldGained} Ouro`;
      if (reward.leveledUp) mensagem += `\n\n🆙 LEVEL UP! Nível ${reward.newLevel}!`;

      alert(mensagem);

      // 4. Atualiza dados
      await fetchCharacter();

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar progresso.");
    } finally {
      setActiveQuest(null);
    }
  };

  // Chamado quando o usuário clica em "Fugir"
  const handleQuestCancel = () => {
    if (confirm("Tem certeza? Você não ganhará recompensa por esta sessão.")) {
      setActiveQuest(null); // Volta para a lista sem ganhar nada
    }
  };

  // --- RENDERIZAÇÃO ---

  // 1. Tela de Carregamento
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <CircleNotch size={40} className="animate-spin" /> 
         <p style={{ marginLeft: 10 }}>Carregando perfil...</p>
      </div>
    );
  }

  // 2. Se não tem personagem, mostra a tela de Criação
  if (!character) {
    return <CreateCharacter onCharacterCreated={fetchCharacter} />;
  }

  // 3. Se tem personagem, mostra o Painel Principal
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      
{/* HEADER DO PERSONAGEM - VERSÃO 2.0 (Com Barra de XP) */}
      <header style={{ 
        background: '#202024', padding: 24, borderRadius: 8, 
        // Layout em Grid para organizar melhor: Info Esquerda | Status Direita
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center',
        opacity: activeQuest ? 0.5 : 1, transition: 'opacity 0.3s'
      }}>
        
        {/* Lado Esquerdo: Identidade */}
        <div>
          <h1 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            {character.name}
            {/* Badge de Nível */}
            <span style={{ 
              background: '#8257e5', fontSize: 14, padding: '2px 8px', 
              borderRadius: 4, color: 'white' 
            }}>
              LVL {character.level}
            </span>
          </h1>
          <span style={{ color: '#aaa', fontSize: 14 }}>
            {character.class.toUpperCase()}
          </span>
        </div>
        
        {/* Lado Direito: Status e Progressão */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* Ouro e Vida (Futura) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15, fontSize: 14, color: '#e1e1e6' }}>
            <span>❤️ {character.currentHp} / {character.maxHp} HP</span>
            <span style={{ color: '#F5A623' }}>💰 {character.gold} Ouro</span>
          </div>

          {/* A Barra de XP */}
          <ProgressBar 
            current={character.xp} 
            max={character.level * 500} // Fórmula: Nível * 500
            label="Experiência"
            color="#8257e5" // Roxo
          />

        </div>
      </header>

      {/* ÁREA DE CONTEÚDO DINÂMICA */}
      <div style={{ marginTop: 40 }}>
        
        {/* LÓGICA DE TROCA DE TELA */}
        {activeQuest ? (
          // MODO COMBATE (Timer)
          <ActiveQuest 
            quest={activeQuest} 
            onComplete={handleQuestComplete}
            onCancel={handleQuestCancel}
          />
        ) : (
          // MODO LISTA (QuestBoard)
          <>
            <h2 style={{ marginBottom: 10 }}>📜 Diário de Missões</h2>
            <QuestBoard onStartQuest={(quest) => setActiveQuest(quest)} />
          </>
        )}

      </div>
    </div>
  );
}