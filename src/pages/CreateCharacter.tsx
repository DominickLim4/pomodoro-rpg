// src/pages/CreateCharacter.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCharacter } from '../services/characterService';
import { CharacterClass } from '../types';
import { Sword, Scroll, Knife } from 'phosphor-react'; // Ícones

// Definimos uma propriedade para saber o que fazer quando terminar
interface Props {
  onCharacterCreated: () => void;
}

export function CreateCharacter({ onCharacterCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !name || !selectedClass) return;

    setLoading(true);
    try {
      await createCharacter(user.uid, name, selectedClass);
      onCharacterCreated(); // Avisa o componente pai que terminou
    } catch (err) {
      console.error(err);
      alert("Erro ao criar personagem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h1>Crie seu Herói</h1>
      <p style={{ color: '#aaa' }}>Para começar sua jornada de produtividade, escolha seu destino.</p>

      {/* Input de Nome */}
      <div style={{ margin: '30px 0' }}>
        <label style={{ display: 'block', marginBottom: 10 }}>Nome do Personagem</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Aragorn, Gandalf..."
          style={{ 
            padding: 15, width: '100%', borderRadius: 8, border: '1px solid #333', 
            background: '#202024', color: 'white', fontSize: 18 
          }}
        />
      </div>

      {/* Seleção de Classe */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 30 }}>
        {/* Guerreiro */}
        <ClassCard 
          title="Guerreiro" 
          icon={<Sword size={32} />} 
          selected={selectedClass === 'guerreiro'}
          onClick={() => setSelectedClass('guerreiro')}
        />
        {/* Mago */}
        <ClassCard 
          title="Mago" 
          icon={<Scroll size={32} />} 
          selected={selectedClass === 'mago'}
          onClick={() => setSelectedClass('mago')}
        />
        {/* Ladino */}
        <ClassCard 
          title="Ladino" 
          icon={<Knife size={32} />} 
          selected={selectedClass === 'ladino'}
          onClick={() => setSelectedClass('ladino')}
        />
      </div>

      <button 
        disabled={!name || !selectedClass || loading}
        onClick={handleCreate}
        style={{ 
          padding: '15px 40px', background: '#8257e5', color: 'white', border: 'none', 
          borderRadius: 8, fontSize: 18, cursor: 'pointer', opacity: (!name || !selectedClass) ? 0.5 : 1 
        }}
      >
        {loading ? 'Forjando...' : 'Iniciar Jornada'}
      </button>
    </div>
  );
}

// 1. Defina o formato das props (propriedades) que o componente aceita
interface ClassCardProps {
  title: string;
  icon: React.ReactNode; // Aceita qualquer elemento React (ícones, divs, etc)
  selected: boolean;
  onClick: () => void;
}

// 2. Aplique a interface na função
function ClassCard({ title, icon, selected, onClick }: ClassCardProps) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        border: selected ? '2px solid #8257e5' : '2px solid #333',
        background: selected ? '#29292e' : 'transparent',
        padding: 20, borderRadius: 8, cursor: 'pointer', width: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
      }}
    >
      <div style={{ color: selected ? '#8257e5' : 'white' }}>{icon}</div>
      <span>{title}</span>
    </div>
  )
}