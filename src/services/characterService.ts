// src/services/characterService.ts
import { db } from '../lib/firebase';
import { Character, CharacterClass } from '../types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Adicione updateDoc

// Função auxiliar para definir atributos iniciais baseados na classe
const getInitialStats = (classe: CharacterClass) => {
  switch (classe) {
    case 'guerreiro': return { maxHp: 100 };
    case 'mago': return { maxHp: 60 };
    case 'ladino': return { maxHp: 80 };
  }
};

// 1. Buscar Personagem
export const getCharacter = async (userId: string): Promise<Character | null> => {
  // Referência ao documento: users/USER_ID/character/main
  // (Estamos criando uma sub-coleção 'character' e um doc fixo chamado 'main')
  const docRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Character;
  } else {
    return null;
  }
};

// 2. Criar Personagem
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
    createdAt: new Date() // O Firestore converte isso para Timestamp automaticamente
  };

  // Salva no caminho: users/{userId}/character/main
  await setDoc(doc(db, 'users', userId, 'character', 'main'), newCharacter);
  
  return newCharacter;
};

// src/services/characterService.ts
// ... (imports anteriores mantidos)

// ... (funções getCharacter e createCharacter mantidas) ...

// NOVA FUNÇÃO: Adicionar XP e Ouro
export const addReward = async (userId: string, minutes: number) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);

  if (!docSnap.exists()) throw new Error("Personagem não encontrado!");

  const char = docSnap.data() as Character;

  // 1. Calcula Ganhos
  const xpGained = minutes * 10;
  const goldGained = minutes * 5;

  let newXp = char.xp + xpGained;
  const newGold = char.gold + goldGained;
  let newLevel = char.level;
  let newMaxHp = char.maxHp;
  let leveledUp = false;

  // 2. Lógica de Level Up (Loop caso suba múltiplos níveis)
  // XP Necessário = Nível * 500
  let xpToNextLevel = newLevel * 500;

  while (newXp >= xpToNextLevel) {
    newXp -= xpToNextLevel; // Remove o XP usado e sobra o resto
    newLevel++;             // Sobe nível
    newMaxHp += 20;         // Ganha 20 de vida máxima
    leveledUp = true;
    
    // Recalcula a meta para o próximo (agora mais difícil)
    xpToNextLevel = newLevel * 500;
  }

  // 3. Salva no Banco
  await updateDoc(charRef, {
    xp: newXp,
    gold: newGold,
    level: newLevel,
    maxHp: newMaxHp,
    currentHp: newMaxHp // Cura o personagem ao subir de nível ou terminar quest
  });

  return {
    xpGained,
    goldGained,
    leveledUp,
    newLevel
  };
};