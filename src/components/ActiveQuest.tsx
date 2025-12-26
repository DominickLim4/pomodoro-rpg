import { useState, useEffect } from 'react';
import { Quest } from '../types';
import { Area } from '../data/gameData';
import { XCircle, Sword, MapPin } from 'phosphor-react';

interface Props {
  quest: Quest;
  area: Area; // Recebe a área para mostrar o nome e usar a cor
  onComplete: () => void;
  onCancel: () => void;
}

export function ActiveQuest({ quest, area, onComplete, onCancel }: Props) {
  // Converte minutos para segundos
  const [secondsLeft, setSecondsLeft] = useState(quest.durationMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => seconds - 1);
      }, 1000); // Roda a cada 1 segundo
    } else if (secondsLeft === 0) {
      // Tempo acabou!
      setIsActive(false);
      onComplete(); // Avisa o pai (GameWrapper) para rodar o combate
    }

    // Limpeza segura ao sair da tela
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, onComplete]);

  // Formata o tempo para MM:SS (ex: 25:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cálculos visuais da barra
  const totalSeconds = quest.durationMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div style={{ textAlign: 'center', padding: 40, animation: 'fadeIn 0.5s' }}>
      
      {/* --- INFO DA ÁREA (Badge Superior) --- */}
      <div style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 8, 
        background: '#202024', padding: '8px 16px', borderRadius: 20, marginBottom: 20,
        border: `1px solid ${area.color}`
      }}>
        <MapPin size={16} color={area.color} weight="fill" />
        <span style={{ color: '#ccc', fontSize: 14 }}>
          Explorando: <strong style={{ color: area.color }}>{area.name}</strong>
        </span>
      </div>

      <h2 style={{ color: '#8257e5', marginBottom: 5, marginTop: 0 }}>⚔️ {quest.title}</h2>
      <p style={{ color: '#aaa' }}>Foco total para sobreviver!</p>

      {/* --- O TIMER --- */}
      <div style={{ 
        fontSize: '5rem', fontWeight: 'bold', fontFamily: 'monospace', 
        margin: '30px 0', color: secondsLeft < 60 ? '#f75a68' : 'white',
        transition: 'color 0.3s'
      }}>
        {formatTime(secondsLeft)}
      </div>

      {/* --- BARRA DE PROGRESSO (Com a cor da área) --- */}
      <div style={{ 
        width: '100%', maxWidth: 400, height: 20, 
        background: '#333', borderRadius: 10, margin: '0 auto 40px', 
        overflow: 'hidden', position: 'relative'
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          background: area.color, // A barra tem a cor da área (verde, roxo, etc)
          transition: 'width 1s linear',
          boxShadow: `0 0 10px ${area.color}`
        }} />
      </div>

      {/* --- BOTÃO DE DESISTIR --- */}
      <button 
        onClick={onCancel}
        style={{ 
          background: 'transparent', border: '1px solid #f75a68', color: '#f75a68',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto',
          fontSize: 14, fontWeight: 'bold'
        }}
      >
        <XCircle size={24} />
        Fugir da Batalha (Cancelar)
      </button>

      {/* --- ANIMAÇÃO DE COMBATE --- */}
      <div style={{ marginTop: 50 }}>
        <Sword size={64} className="animate-pulse" color={area.color} weight="duotone" />
        <p style={{ fontSize: 12, color: '#555', marginTop: 10 }}>O herói está lutando...</p>
      </div>
    </div>
  );
}