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
import { CircleNotch } from 'phosphor-react';

export function GameWrapper() {
  const { user } = useAuth();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DO JOGO ---
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);

  // --- TRAVA DE SEGURANÇA (Correção do Bug Duplo) ---
  // Impede que a recompensa seja processada duas vezes simultaneamente
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

  // --- HANDLERS DE INÍCIO ---

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

  // --- HANDLERS DE FIM (Com proteção contra bugs) ---

  const handleQuestComplete = async () => {
    // 1. CHECAGEM DE SEGURANÇA: Se já está processando, PARA TUDO.
    if (isProcessing) return;
    if (!user || !activeQuest || !activeArea || !character || !activeQuest.id) return;

    // 2. ATIVA A TRAVA
    setIsProcessing(true);

    try {
      // Simulação
      const result = simulateCombat(character, activeArea, activeQuest.durationMinutes);

      // Salva no Banco (XP, Itens, etc)
      await processCombatResult(user.uid, result);
      
      // Marca Quest como completa
      await completeQuest(user.uid, activeQuest.id);

      // --- GERAR RELATÓRIO DO ALERTA ---
      let report = `⚔️ Relatório de Batalha em ${activeArea.name}:\n\n`;
      
      // Inimigos
      if (result.kills.length > 0) {
        report += `💀 Inimigos Derrotados:\n`;
        result.kills.forEach(k => report += `   - ${k.count}x ${k.enemyName}\n`);
      } else {
        report += `💀 Nenhum inimigo derrotado.\n`;
      }
      
      // XP e Ouro
      report += `\n💰 Ganhos:\n   +${result.xpEarned} XP\n   +${result.goldEarned} Ouro`;
      
      // Loot (Agrupado para ficar bonito)
      if (result.itemsDropped.length > 0) {
        report += `\n\n🎒 Loot Encontrado:\n`;
        // Pega nomes únicos para não repetir "Geléia" 3 vezes
        const uniqueItems = Array.from(new Set(result.itemsDropped.map(i => i.name)));
        
        uniqueItems.forEach(name => {
          const count = result.itemsDropped.filter(i => i.name === name).length;
          report += `   - ${count}x ${name}\n`;
        });
      }

      report += `\n❤️ Dano Sofrido: -${result.hpLost} HP`;

      alert(report);
      
      // Atualiza a tela
      await fetchCharacter();

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar o combate. Tente novamente.");
    } finally {
      // 3. LIMPEZA FINAL
      setActiveQuest(null);
      setActiveArea(null);
      
      // Libera a trava após um pequeno delay para garantir
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
      
      {pendingQuest && (
        <AreaSelector 
          userLevel={character.level}
          onSelect={handleAreaSelect}
          onCancel={() => setPendingQuest(null)}
        />
      )}

      <AdminPanel onUpdate={fetchCharacter} />

      {/* HEADER */}
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
          
          <div style={{ width: '100%', background: '#333', height: 6, borderRadius: 3, overflow: 'hidden' }}>
             <div style={{ 
               width: `${Math.min(100, (character.xp / (character.level * 500)) * 100)}%`, 
               background: '#8257e5', height: '100%', transition: 'width 0.5s' 
             }} />
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ marginTop: 40 }}>
        
        {activeQuest && activeArea ? (
          <ActiveQuest 
            quest={activeQuest} 
            area={activeArea}
            onComplete={handleQuestComplete}
            onCancel={handleQuestCancel}
          />
        ) : (
          <>
            <h2 style={{ marginBottom: 10 }}>📜 Diário de Missões</h2>
            <QuestBoard onStartQuest={handleStartClick} />
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 20, marginTop: 20 
            }}>
              <CharacterStats character={character} />
              
              {/* Agora passamos onUpdate para o Inventário poder atualizar o Ouro ao vender itens */}
              <Inventory items={character.inventory} onUpdate={fetchCharacter} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}