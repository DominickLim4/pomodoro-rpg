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

// Status Derivados (Calculados)
export interface CombatStats {
  hp: number;
  sp: number; // Mana (Futuro)
  atk: number;
  matk: number;
  def: number; // Defesa Física
  mdef: number; // Defesa Mágica
  hit: number; // Precisão
  flee: number; // Esquiva
  aspd: number; // Velocidade de Ataque (Golpes por segundo)
  crit: number; // Chance Crítica (%)
}

// Slots de Equipamento
export type EquipmentSlot = 'head' | 'body' | 'weapon' | 'accessory' | 'legs';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  // Novos campos opcionais para equipamentos
  type?: 'material' | 'equipment' | 'consumable';
  slot?: EquipmentSlot;
  stats?: Partial<Attributes>; // Ex: Espada dá +5 STR
  atk?: number; // Dano da arma
  def?: number; // Defesa da armadura
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

  // A Mochila do Jogador
  inventory: InventoryItem[]; 
    
  // O que está equipado no corpo
  equipment: {
    [key in EquipmentSlot]?: InventoryItem;
  };

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