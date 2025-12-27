// src/pages/GameWrapper.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCharacter, processCombatResult } from '../services/characterService';
import { completeQuest } from '../services/questService';
import { simulateCombat } from '../utils/combatEngine';
import { Character, Quest } from '../types';
import { Area } from '../data/gameData';

// Componentes
import { CreateCharacter } from './CreateCharacter';
import { QuestBoard } from '../components/QuestBoard';
import { ActiveQuest } from '../components/ActiveQuest';
import { CharacterStats } from '../components/CharacterStats';
import { AdminPanel } from '../components/AdminPanel';
import { AreaSelector } from '../components/AreaSelector';
import { Inventory } from '../components/Inventory';
import { ProfileModal } from '../components/ProfileModal'; // NOVO: Modal de Perfil
import { CircleNotch } from 'phosphor-react';

export function GameWrapper() {
  const { user } = useAuth();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DO JOGO ---
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);
  
  // Controle do Modal de Perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Trava de segurança contra cliques duplos/bugs de recompensa
  const [isProcessing, setIsProcessing] = useState(false);

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

  // --- HANDLERS ---

  const handleStartClick = (quest: Quest) => {
    setPendingQuest(quest); 
  };

  const handleAreaSelect = (area: Area) => {
    if (pendingQuest) {
      setActiveArea(area);
      setActiveQuest(pendingQuest);
      setPendingQuest(null);
    }
  };

  const handleQuestComplete = async () => {
    if (isProcessing) return;
    if (!user || !activeQuest || !activeArea || !character || !activeQuest.id) return;

    setIsProcessing(true);

    try {
      // 1. Simulação Matemática
      const result = simulateCombat(character, activeArea, activeQuest.durationMinutes);

      // 2. Salvar Resultados
      await processCombatResult(user.uid, result);
      await completeQuest(user.uid, activeQuest.id);

      // 3. Gerar Relatório
      let report = `⚔️ Relatório de Batalha em ${activeArea.name}:\n\n`;
      
      if (result.kills.length > 0) {
        report += `💀 Inimigos Derrotados:\n`;
        result.kills.forEach(k => report += `   - ${k.count}x ${k.enemyName}\n`);
      } else {
        report += `💀 Nenhum inimigo derrotado.\n`;
      }
      
      report += `\n💰 Ganhos:\n   +${result.xpEarned} XP\n   +${result.goldEarned} Ouro`;
      
      if (result.itemsDropped.length > 0) {
        report += `\n\n🎒 Loot Encontrado:\n`;
        const uniqueItems = Array.from(new Set(result.itemsDropped.map(i => i.name)));
        uniqueItems.forEach(name => {
          const count = result.itemsDropped.filter(i => i.name === name).length;
          report += `   - ${count}x ${name}\n`;
        });
      }

      report += `\n❤️ Dano Sofrido: -${result.hpLost} HP`;

      alert(report);
      await fetchCharacter();

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar o combate.");
    } finally {
      setActiveQuest(null);
      setActiveArea(null);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleQuestCancel = () => {
    if (confirm("Tem certeza? Você fugirá da batalha e não ganhará nada.")) {
      setActiveQuest(null);
      setActiveArea(null);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <CircleNotch size={40} className="animate-spin" /> 
         <p style={{ marginLeft: 10 }}>Carregando...</p>
      </div>
    );
  }

  if (!character) {
    return <CreateCharacter onCharacterCreated={fetchCharacter} />;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* 1. MODAL DE PERFIL (Novo) */}
      {isProfileOpen && (
        <ProfileModal character={character} onClose={() => setIsProfileOpen(false)} />
      )}

      {/* 2. MODAL DE SELEÇÃO DE ÁREA */}
      {pendingQuest && (
        <AreaSelector 
          userLevel={character.level}
          onSelect={handleAreaSelect}
          onCancel={() => setPendingQuest(null)}
        />
      )}

      {/* 3. BOTÃO ADMIN FLUTUANTE */}
      <AdminPanel onUpdate={fetchCharacter} />

      {/* 4. HEADER DO PERSONAGEM (Atualizado com Avatar) */}
      <header style={{ 
        background: '#202024', padding: 24, borderRadius: 8, 
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center',
        opacity: activeQuest ? 0.5 : 1, transition: 'opacity 0.3s'
      }}>
        {/* Lado Esquerdo: Avatar e Nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          
          {/* Botão do Avatar - Abre o Perfil */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            style={{ 
              width: 50, height: 50, borderRadius: '50%', background: '#323238', 
              border: '2px solid #8257e5', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              overflow: 'hidden', transition: 'transform 0.2s', outline: 'none'
            }}
            title="Abrir Perfil Completo"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🧑‍🚀
          </button>

          <div>
            <h1 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              {character.name}
              <span style={{ background: '#8257e5', fontSize: 14, padding: '2px 8px', borderRadius: 4, color: 'white' }}>
                LVL {character.level}
              </span>
            </h1>
            <span 
              onClick={() => setIsProfileOpen(true)}
              style={{ color: '#aaa', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {character.class.toUpperCase()} (Ver Status)
            </span>
          </div>
        </div>
        
        {/* Lado Direito: Status Vitais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 15, fontSize: 14, color: '#e1e1e6' }}>
            <span>❤️ {character.currentHp} / {character.maxHp} HP</span>
            <span style={{ color: '#F5A623' }}>💰 {character.gold} Ouro</span>
          </div>
          
          <div style={{ width: '100%', background: '#333', height: 6, borderRadius: 3, overflow: 'hidden' }}>
             <div style={{ 
               width: `${Math.min(100, (character.xp / (character.level * 500)) * 100)}%`, 
               background: '#8257e5', height: '100%', transition: 'width 0.5s' 
             }} />
          </div>
        </div>
      </header>

      {/* 5. ÁREA DE CONTEÚDO */}
      <div style={{ marginTop: 40 }}>
        
        {activeQuest && activeArea ? (
          // Combate (Timer)
          <ActiveQuest 
            quest={activeQuest} 
            area={activeArea}
            onComplete={handleQuestComplete}
            onCancel={handleQuestCancel}
          />
        ) : (
          // Lista de Tarefas + RPG
          <>
            <h2 style={{ marginBottom: 10 }}>📜 Diário de Missões</h2>
            <QuestBoard onStartQuest={handleStartClick} />
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 20, marginTop: 20 
            }}>
              <CharacterStats character={character} />
              
              <Inventory items={character.inventory} onUpdate={fetchCharacter} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}