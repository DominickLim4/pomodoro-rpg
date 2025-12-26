import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCharacter, addReward } from '../services/characterService';
import { completeQuest } from '../services/questService';
import { Character, Quest } from '../types';
import { Area } from '../data/gameData'; // Importando Tipo de Área

import { CreateCharacter } from './CreateCharacter';
import { QuestBoard } from '../components/QuestBoard';
import { ActiveQuest } from '../components/ActiveQuest';
import { CharacterStats } from '../components/CharacterStats';
import { AdminPanel } from '../components/AdminPanel';
import { AreaSelector } from '../components/AreaSelector'; // Importando o Seletor
import { CircleNotch } from 'phosphor-react';

export function GameWrapper() {
  const { user } = useAuth();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DO JOGO
  // 1. Qual quest está rodando agora?
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  
  // 2. Qual área o jogador escolheu? (NOVO)
  const [activeArea, setActiveArea] = useState<Area | null>(null);

  // 3. Qual quest foi clicada mas ainda falta escolher a área? (NOVO)
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);

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

  // --- NOVAS LÓGICAS DE INÍCIO (Aqui está o que você procurava) ---

  // Passo 1: Usuário clica em "Iniciar" na lista
  const handleStartClick = (quest: Quest) => {
    // Ao invés de começar direto, guardamos a quest e abrimos o seletor
    setPendingQuest(quest); 
  };

  // Passo 2: Usuário escolhe a Área no modal
  const handleAreaSelect = (area: Area) => {
    if (pendingQuest) {
      setActiveArea(area);          // Salva a área
      setActiveQuest(pendingQuest); // Inicia o Timer agora sim
      setPendingQuest(null);        // Fecha o modal
    }
  };

  // --- LÓGICAS DE FIM DE JOGO ---

  const handleQuestComplete = async () => {
    if (!user || !activeQuest) return;

    try {
      const reward = await addReward(user.uid, activeQuest.durationMinutes);
      await completeQuest(user.uid, activeQuest.id!); // O ! garante que tem ID

      let mensagem = `🎉 Missão Cumprida!\n\nVocê ganhou:\n✨ +${reward.xpGained} XP\n💰 +${reward.goldGained} Ouro`;
      if (reward.leveledUp) mensagem += `\n\n🆙 LEVEL UP! Nível ${reward.newLevel}!`;

      alert(mensagem);
      await fetchCharacter();

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar progresso.");
    } finally {
      setActiveQuest(null);
      setActiveArea(null); // Limpa a área
    }
  };

  const handleQuestCancel = () => {
    if (confirm("Tem certeza? Você não ganhará recompensa.")) {
      setActiveQuest(null);
      setActiveArea(null); // Limpa a área
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <CircleNotch size={40} className="animate-spin" /> 
         <p style={{ marginLeft: 10 }}>Carregando perfil...</p>
      </div>
    );
  }

  if (!character) {
    return <CreateCharacter onCharacterCreated={fetchCharacter} />;
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* MODAL DE SELEÇÃO DE ÁREA (Só aparece se tiver quest pendente) */}
      {pendingQuest && (
        <AreaSelector 
          userLevel={character.level}
          onSelect={handleAreaSelect}
          onCancel={() => setPendingQuest(null)}
        />
      )}

      <AdminPanel onUpdate={fetchCharacter} />

      {/* HEADER DO PERSONAGEM */}
      <header style={{ 
        background: '#202024', padding: 24, borderRadius: 8, 
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center',
        opacity: activeQuest ? 0.5 : 1, transition: 'opacity 0.3s'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            {character.name}
            <span style={{ background: '#8257e5', fontSize: 14, padding: '2px 8px', borderRadius: 4, color: 'white' }}>
              LVL {character.level}
            </span>
          </h1>
          <span style={{ color: '#aaa', fontSize: 14 }}>{character.class.toUpperCase()}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 15, fontSize: 14, color: '#e1e1e6' }}>
            <span>❤️ {character.currentHp} / {character.maxHp} HP</span>
            <span style={{ color: '#F5A623' }}>💰 {character.gold} Ouro</span>
          </div>
          {/* Barra de XP simplificada visualmente */}
          <div style={{ width: '100%', background: '#333', height: 6, borderRadius: 3 }}>
             <div style={{ width: `${(character.xp / (character.level * 500)) * 100}%`, background: '#8257e5', height: '100%' }} />
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <div style={{ marginTop: 40 }}>
        
        {activeQuest && activeArea ? (
          // MODO COMBATE
          <ActiveQuest 
            quest={activeQuest} 
            // area={activeArea} <-- Passaremos isso na Fase C
            onComplete={handleQuestComplete}
            onCancel={handleQuestCancel}
          />
        ) : (
          // MODO LISTA
          <>
            <h2 style={{ marginBottom: 10 }}>📜 Diário de Missões</h2>
            
            {/* AQUI ESTÁ A MUDANÇA NO QUESTBOARD */}
            {/* Agora passamos a função handleStartClick ao invés de setActiveQuest direto */}
            <QuestBoard onStartQuest={handleStartClick} />
            
            <CharacterStats character={character} />
          </>
        )}

      </div>
    </div>
  );
}