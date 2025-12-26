// src/services/characterService.ts
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Character, CharacterClass, Attributes } from '../types';

// Função auxiliar para status iniciais (Base + HP)
const getInitialStats = (classe: CharacterClass) => {
  // HP base muda por classe, atributos começam todos em 1 (Novato style)
  const baseAttributes: Attributes = { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
  
  switch (classe) {
    case 'guerreiro': return { maxHp: 150, attrs: { ...baseAttributes, str: 5, vit: 3 } }; // Guerreiro começa mais forte
    case 'mago':      return { maxHp: 80,  attrs: { ...baseAttributes, int: 5, dex: 3 } }; // Mago começa mais inteligente
    case 'ladino':    return { maxHp: 100, attrs: { ...baseAttributes, agi: 5, luk: 3 } }; // Ladino mais rápido
  }
};

export const getCharacter = async (userId: string): Promise<Character | null> => {
  const docRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as Character;
  return null;
};

// ATUALIZADO: Criação com atributos
export const createCharacter = async (userId: string, name: string, classe: CharacterClass) => {
  const stats = getInitialStats(classe);
  
  const newCharacter: Character = {
    uid: userId,
    name,
    class: classe,
    level: 1,
    xp: 0,
    gold: 0,
    maxHp: stats.maxHp,
    currentHp: stats.maxHp,
    attributes: stats.attrs, // Adiciona os atributos iniciais
    statPoints: 0,           // Começa com 0 pontos para gastar
    createdAt: new Date()
  };

  await setDoc(doc(db, 'users', userId, 'character', 'main'), newCharacter);
  return newCharacter;
};

// ATUALIZADO: Level Up concede Stat Points
export const addReward = async (userId: string, minutes: number) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  if (!docSnap.exists()) throw new Error("Personagem não encontrado!");

  const char = docSnap.data() as Character;
  const xpGained = minutes * 10;
  const goldGained = minutes * 5;

  let newXp = char.xp + xpGained;
  let newLevel = char.level;
  let newStatPoints = char.statPoints || 0; // Garante que não é undefined
  let leveledUp = false;

  let xpToNextLevel = newLevel * 500;

  while (newXp >= xpToNextLevel) {
    newXp -= xpToNextLevel;
    newLevel++;
    newStatPoints += 5; // GANHA 5 PONTOS POR NÍVEL
    leveledUp = true;
    xpToNextLevel = newLevel * 500;
  }

  // Se o personagem antigo não tinha atributos (migração), inicializa com 1
  const currentAttrs = char.attributes || { str:1, agi:1, vit:1, int:1, dex:1, luk:1 };

  await updateDoc(charRef, {
    xp: newXp,
    gold: char.gold + goldGained,
    level: newLevel,
    statPoints: newStatPoints,
    currentHp: char.maxHp, // Cura completa
    attributes: currentAttrs // Garante que salva se não existia
  });

  return { xpGained, goldGained, leveledUp, newLevel };
};

// NOVA FUNÇÃO: Distribuir Pontos
export const upgradeAttribute = async (userId: string, attribute: keyof Attributes) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  
  if (!docSnap.exists()) return;
  const char = docSnap.data() as Character;

  if (char.statPoints > 0) {
    const newAttributes = { ...char.attributes };
    newAttributes[attribute] += 1; // Aumenta 1 no atributo escolhido

    await updateDoc(charRef, {
      attributes: newAttributes,
      statPoints: char.statPoints - 1 // Gasta 1 ponto
    });
  }
};