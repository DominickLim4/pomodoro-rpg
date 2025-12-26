export type CharacterClass = 'guerreiro' | 'mago' | 'ladino';

// Novo: Objeto de Atributos
export interface Attributes {
  str: number; // Força (Dano Físico)
  agi: number; // Agilidade (Velocidade de Ataque)
  vit: number; // Vitalidade (Vida Máxima)
  int: number; // Inteligência (Dano Mágico)
  dex: number; // Destreza (Precisão/Estabilidade)
  luk: number; // Sorte (Crítico/Drops)
}

export interface Character {
  uid: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  gold: number;
  
  // Stats de Vida
  maxHp: number;
  currentHp: number;
  
  // Sistema de Atributos
  attributes: Attributes;
  statPoints: number; // Pontos livres para distribuir
  
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Character {
  uid: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  gold: number;
  
  maxHp: number;
  currentHp: number;
  
  attributes: Attributes;
  statPoints: number;

  // NOVO: A Mochila do Jogador
  inventory: InventoryItem[]; 
  
  createdAt: Date;
}

export interface Quest {
  id?: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}