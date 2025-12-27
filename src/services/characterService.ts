// src/services/characterService.ts
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Character, CharacterClass, Attributes } from '../types';
import { CombatResult } from '../utils/combatEngine';
import { InventoryItem, EquipmentSlot } from '../types';
import { AREAS } from '../data/gameData';

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
    statPoints: 0,
               // Começa com 0 pontos para gastar
    inventory: [],
    equipment: {},

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

export const processCombatResult = async (userId: string, result: CombatResult) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  if (!docSnap.exists()) return;

  const char = docSnap.data() as Character;

  // 1. Cálculos de XP e Nível (Mantém igual ao que já tinhas)
  let newXp = char.xp + result.xpEarned;
  let newLevel = char.level;
  let newStatPoints = char.statPoints;
  let newMaxHp = char.maxHp;
  
  let xpToNextLevel = newLevel * 500;
  while (newXp >= xpToNextLevel) {
    newXp -= xpToNextLevel;
    newLevel++;
    newStatPoints += 5;
    newMaxHp += 20;
    xpToNextLevel = newLevel * 500;
  }

  // 2. Cálculo de Vida (Mantém igual)
  let currentHp = char.currentHp;
  if (newLevel > char.level) {
    currentHp = newMaxHp; 
  } else {
    currentHp = Math.max(0, currentHp - result.hpLost);
  }

  // 3. LÓGICA NOVA: Processar o Inventário (Stacking)
  // Garante que existe um array, mesmo que venha do banco como undefined
  const currentInventory: InventoryItem[] = char.inventory || [];

  result.itemsDropped.forEach((droppedItem) => {
    // Procura se já temos este item na mochila
    const existingItemIndex = currentInventory.findIndex(i => i.id === droppedItem.id);

    if (existingItemIndex >= 0) {
      // Se já existe, aumenta a quantidade
      currentInventory[existingItemIndex].quantity += 1;
    } else {
      // Se é novo, adiciona à lista com quantidade 1
      currentInventory.push({
        id: droppedItem.id,
        name: droppedItem.name,
        quantity: 1
      });
    }
  });

  // 4. Salvar tudo
  await updateDoc(charRef, {
    xp: newXp,
    gold: char.gold + result.goldEarned,
    level: newLevel,
    statPoints: newStatPoints,
    maxHp: newMaxHp,
    currentHp: currentHp,
    inventory: currentInventory // <--- Salva a mochila atualizada
  });
};

export const sellItemBatch = async (userId: string, itemId: string, amount: number) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  if (!docSnap.exists()) return;
  const char = docSnap.data() as Character;

  const inventory = char.inventory || [];
  const itemIndex = inventory.findIndex(i => i.id === itemId);

  if (itemIndex === -1) return;

  // Lógica de Preço (Igual antes)
  let price = 0;
  // ... (Lógica de buscar preço nas AREAS igualzinha a anterior) ...
  // ... Se quiser, extraia essa busca de preço para uma função auxiliar 'getItemPrice(id)'
  
  // Hardcode rápido pro exemplo:
  for (const area of AREAS) {
     for (const enemy of area.enemies) {
       const found = enemy.drops.find(d => d.id === itemId);
       if (found) price = found.sellPrice;
     }
  }
  if (price === 0) price = 1;

  // Atualiza
  if (inventory[itemIndex].quantity > amount) {
    inventory[itemIndex].quantity -= amount;
  } else {
    // Vendeu tudo ou mais do que tinha
    inventory.splice(itemIndex, 1);
  }

  await updateDoc(charRef, {
    inventory: inventory,
    gold: char.gold + (price * amount)
  });
};

// FUNÇÃO: EQUIPAR ITEM
export const equipItem = async (userId: string, itemId: string) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  if (!docSnap.exists()) return;
  
  const char = docSnap.data() as Character;
  const inventory = char.inventory || [];
  const equipment = char.equipment || {};

  // 1. Achar o item no inventário
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return; // Item não existe

  //const itemToEquip = inventory[itemIndex];

  // 2. Descobrir os dados do item (Slot, Atk, etc)
  // Precisamos buscar no gameData porque o inventário as vezes salva versão resumida
  let itemMeta = null;
  for (const area of AREAS) {
    for (const enemy of area.enemies) {
      const found = enemy.drops.find(d => d.id === itemId);
      if (found) itemMeta = found;
    }
  }

  // Se não achou metadata ou não é equipamento, aborta
  if (!itemMeta || itemMeta.type !== 'equipment' || !itemMeta.slot) {
    console.error("Tentou equipar item inválido ou sem slot");
    return;
  }

  const slot = itemMeta.slot as EquipmentSlot;

  // 3. Se já tem algo equipado no slot, desequipa (troca)
  if (equipment[slot]) {
    const oldItem = equipment[slot]!;
    // Devolve o item velho pra mochila
    const existingInInv = inventory.findIndex(i => i.id === oldItem.id);
    if (existingInInv >= 0) {
      inventory[existingInInv].quantity += 1;
    } else {
      inventory.push({ ...oldItem, quantity: 1 });
    }
  }

  // 4. Equipa o novo item
  // Salva no slot uma cópia do item com os stats importantes
  equipment[slot] = {
    id: itemMeta.id,
    name: itemMeta.name,
    quantity: 1,
    type: 'equipment',
    slot: slot,
    atk: itemMeta.atk,
    def: itemMeta.def,
    stats: itemMeta.stats
  };

  // 5. Remove da mochila
  if (inventory[itemIndex].quantity > 1) {
    inventory[itemIndex].quantity -= 1;
  } else {
    inventory.splice(itemIndex, 1);
  }

  // 6. Salva tudo
  await updateDoc(charRef, {
    inventory,
    equipment
  });
};

// FUNÇÃO: DESEQUIPAR ITEM
export const unequipItem = async (userId: string, slot: EquipmentSlot) => {
  const charRef = doc(db, 'users', userId, 'character', 'main');
  const docSnap = await getDoc(charRef);
  if (!docSnap.exists()) return;

  const char = docSnap.data() as Character;
  const inventory = char.inventory || [];
  const equipment = char.equipment || {};

  // 1. Verifica se tem algo no slot
  const itemToUnequip = equipment[slot];
  if (!itemToUnequip) return;

  // 2. Remove do corpo
  delete equipment[slot];

  // 3. Devolve para a mochila
  const existingInInv = inventory.findIndex(i => i.id === itemToUnequip.id);
  if (existingInInv >= 0) {
    inventory[existingInInv].quantity += 1;
  } else {
    inventory.push({
      id: itemToUnequip.id,
      name: itemToUnequip.name,
      quantity: 1,
      type: 'equipment' // Garante tipagem básica
    });
  }

  // 4. Salva
  await updateDoc(charRef, {
    inventory,
    equipment
  });
};