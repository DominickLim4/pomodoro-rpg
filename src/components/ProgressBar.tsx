// src/components/ProgressBar.tsx
interface ProgressBarProps {
  current: number; // Valor atual (ex: 150)
  max: number;     // Valor máximo (ex: 500)
  color?: string;  // Cor da barra (opcional)
  label?: string;  // Texto para aparecer em cima (ex: "150 / 500 XP")
}

export function ProgressBar({ current, max, color = '#8257e5', label }: ProgressBarProps) {
  // Garante que a porcentagem não passe de 100% nem seja negativa
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Texto descritivo acima da barra (opcional) */}
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
          <span>{label}</span>
          <span>{Math.floor(percentage)}%</span>
        </div>
      )}

      {/* A Barra em si */}
      <div style={{ 
        width: '100%', 
        height: 10, 
        background: '#333', 
        borderRadius: 5, 
        overflow: 'hidden' // Corta a barra colorida se ela tentar sair
      }}>
        <div 
          style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            background: color, 
            transition: 'width 0.5s ease-out', // Animação suave ao ganhar XP
            boxShadow: `0 0 10px ${color}`     // Um brilho suave
          }} 
        />
      </div>
    </div>
  );
}