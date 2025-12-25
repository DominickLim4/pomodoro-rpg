// src/components/QuestBoard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createQuest, deleteQuest, subscribeToQuests } from '../services/questService';
import { Quest } from '../types';
import { Trash, Scroll, Clock, Play, CheckCircle } from 'phosphor-react';

interface QuestBoardProps {
  onStartQuest: (quest: Quest) => void;
}

export function QuestBoard({ onStartQuest }: QuestBoardProps) {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  
  // ESTADO DA ABA: 'todo' (A Fazer) ou 'done' (Concluídas)
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(25);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToQuests(user.uid, (novosDados) => setQuests(novosDados));
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;
    await createQuest(user.uid, { title, description: '', durationMinutes: duration });
    setTitle('');
  };

  const handleDelete = async (id: string) => {
    if (user && confirm("Apagar este registro para sempre?")) {
      await deleteQuest(user.uid, id);
    }
  };

  // FILTRAGEM INTELIGENTE
  // Se a aba for 'done', mostra status 'completed'. 
  // Se for 'todo', mostra qualquer coisa que NÃO seja 'completed' (pending, in_progress)
  const filteredQuests = quests.filter(q => 
    activeTab === 'done' ? q.status === 'completed' : q.status !== 'completed'
  );

  return (
    <div style={{ marginTop: 20 }}>
      
      {/* --- MENU DE ABAS --- */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #333' }}>
        <button 
          onClick={() => setActiveTab('todo')}
          style={{ 
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === 'todo' ? '#8257e5' : '#7c7c8a',
            borderBottom: activeTab === 'todo' ? '2px solid #8257e5' : 'none',
            fontWeight: activeTab === 'todo' ? 'bold' : 'normal'
          }}
        >
          A Fazer
        </button>
        <button 
          onClick={() => setActiveTab('done')}
          style={{ 
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === 'done' ? '#00875f' : '#7c7c8a',
            borderBottom: activeTab === 'done' ? '2px solid #00875f' : 'none',
            fontWeight: activeTab === 'done' ? 'bold' : 'normal'
          }}
        >
          Concluídas
        </button>
      </div>

      {/* --- FORMULÁRIO (Só aparece na aba "A Fazer") --- */}
      {activeTab === 'todo' && (
        <form onSubmit={handleAdd} style={{ 
          background: '#202024', padding: 20, borderRadius: 8, marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'center'
        }}>
          <input 
            type="text" 
            placeholder="Nova Missão..." 
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ 
              flex: 1, padding: 12, borderRadius: 4, border: 'none', 
              background: '#121214', color: 'white' 
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#121214', padding: '0 10px', borderRadius: 4 }}>
            <Clock size={20} color="#7c7c8a" />
            <input 
              type="number" 
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: 50, padding: 12, border: 'none', background: 'transparent', color: 'white', textAlign: 'center' }}
            />
            <span style={{ color: '#7c7c8a', fontSize: 12, marginRight: 5 }}>min</span>
          </div>
          <button type="submit" style={{ padding: '12px 20px', background: '#8257e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            +
          </button>
        </form>
      )}

      {/* --- LISTA --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredQuests.map(quest => (
          <div key={quest.id} style={{ 
            background: '#29292e', padding: 15, borderRadius: 6,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: activeTab === 'done' ? '4px solid #00875f' : '4px solid #8257e5',
            opacity: activeTab === 'done' ? 0.6 : 1 // Deixa as concluídas meio apagadinhas
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              {activeTab === 'done' ? <CheckCircle size={32} color="#00875f" /> : <Scroll size={32} color="#8257e5" />}
              <div>
                <strong style={{ display: 'block', fontSize: 18, textDecoration: activeTab === 'done' ? 'line-through' : 'none' }}>
                  {quest.title}
                </strong>
                <span style={{ color: '#c4c4cc', fontSize: 14 }}>⏱️ {quest.durationMinutes} min</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {/* Só mostra botão INICIAR se NÃO estiver concluída */}
              {activeTab !== 'done' && (
                <button 
                  onClick={() => onStartQuest(quest)} 
                  style={{ 
                    background: 'transparent', border: '1px solid #00875f', color: '#00875f',
                    padding: '8px 16px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  <Play size={16} /> Iniciar
                </button>
              )}

              <button 
                onClick={() => handleDelete(quest.id!)}
                style={{ background: 'transparent', border: 'none', color: '#f75a68', cursor: 'pointer', padding: 8 }}
                title="Excluir Registro"
              >
                <Trash size={24} />
              </button>
            </div>
          </div>
        ))}

        {filteredQuests.length === 0 && (
          <p style={{ textAlign: 'center', color: '#7c7c8a', marginTop: 20 }}>
            {activeTab === 'todo' ? 'Nenhuma missão pendente.' : 'Nenhuma missão concluída ainda.'}
          </p>
        )}
      </div>
    </div>
  );
}