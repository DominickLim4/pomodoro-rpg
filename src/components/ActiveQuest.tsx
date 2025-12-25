// src/components/ActiveQuest.tsx
import { useState, useEffect } from 'react';
import { Quest } from '../types';
import { XCircle, Sword } from 'phosphor-react'; // Removi o 'Timer' que não estava sendo usado

interface Props {
  quest: Quest;
  onComplete: () => void;
  onCancel: () => void;
}

export function ActiveQuest({ quest, onComplete, onCancel }: Props) {
  // Converte minutos para segundos
  const [secondsLeft, setSecondsLeft] = useState(quest.durationMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // CORREÇÃO: Tipagem correta para o setInterval no TypeScript
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => seconds - 1);
      }, 1000); 
    } else if (secondsLeft === 0) {
      // Tempo acabou!
      setIsActive(false);
      onComplete();
    }

    // Limpeza segura
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, onComplete]);

  // Formata o tempo para MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = quest.durationMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div style={{ textAlign: 'center', padding: 40, animation: 'fadeIn 0.5s' }}>
      <h2 style={{ color: '#8257e5', marginBottom: 5 }}>⚔️ Em Combate: {quest.title}</h2>
      <p style={{ color: '#aaa' }}>Mantenha o foco para vencer!</p>

      {/* O Grande Relógio */}
      <div style={{ 
        fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', 
        margin: '40px 0', color: secondsLeft < 60 ? '#f75a68' : 'white' 
      }}>
        {formatTime(secondsLeft)}
      </div>

      {/* Barra de Vida do Inimigo */}
      <div style={{ width: '100%', maxWidth: 400, height: 20, background: '#333', borderRadius: 10, margin: '0 auto 40px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${progress}%`, height: '100%', background: '#00875f', 
          transition: 'width 1s linear' 
        }} />
      </div>

      {/* Botão de Desistir */}
      <button 
        onClick={onCancel}
        style={{ 
          background: 'transparent', border: '1px solid #f75a68', color: '#f75a68',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto'
        }}
      >
        <XCircle size={24} />
        Fugir da Batalha (Cancelar)
      </button>

      {/* Placeholder da Animação */}
      <div style={{ marginTop: 50 }}>
        <Sword size={64} className="animate-pulse" color="#8257e5" weight="duotone" />
        <p style={{ fontSize: 12, color: '#555' }}>O herói está lutando...</p>
      </div>
    </div>
  );
}