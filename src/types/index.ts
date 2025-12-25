// src/types/index.ts

// Definimos quais classes existem no jogo
export type CharacterClass = 'guerreiro' | 'mago' | 'ladino';

// Definimos o formato exato do nosso Personagem no banco de dados
export interface Character {
  uid: string;          // ID do usuário dono do personagem
  name: string;         // Nome do herói
  class: CharacterClass;
  level: number;
  xp: number;
  gold: number;
  maxHp: number;        // Vida Máxima
  currentHp: number;    // Vida Atual
  createdAt: Date;      // Data de criação
}

export interface Quest {
  id?: string;          // O ID do Firestore (opcional na criação)
  title: string;        // Título (ex: "Matar Boss Relatório")
  description: string;  // Detalhes
  durationMinutes: number; // Tempo de foco (ex: 25 min)
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}