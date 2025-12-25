// src/services/questService.ts
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { Quest } from '../types';

// 1. Criar uma nova Quest
export const createQuest = async (userId: string, questData: Omit<Quest, 'id' | 'createdAt' | 'status'>) => {
  try {
    // Salvamos na sub-coleção: users/{userId}/quests
    await addDoc(collection(db, 'users', userId, 'quests'), {
      ...questData,
      status: 'pending',
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Erro ao criar quest:", error);
    throw error;
  }
};

// 2. Deletar uma Quest
export const deleteQuest = async (userId: string, questId: string) => {
  const questRef = doc(db, 'users', userId, 'quests', questId);
  await deleteDoc(questRef);
};

// 3. Ouvir as Quests em Tempo Real (Realtime Listener)
// Esta função recebe um "callback" (setQuests) que será chamado toda vez que o banco mudar
export const subscribeToQuests = (userId: string, onUpdate: (quests: Quest[]) => void): Unsubscribe => {
  const q = query(
    collection(db, 'users', userId, 'quests'),
    orderBy('createdAt', 'desc') // Ordena das mais novas para as mais antigas
  );

  // O onSnapshot fica "vivo" escutando mudanças
  return onSnapshot(q, (snapshot) => {
    const quests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Quest[];
    
    onUpdate(quests);
  });
};

export const completeQuest = async (userId: string, questId: string) => {
  const questRef = doc(db, 'users', userId, 'quests', questId);
  
  await updateDoc(questRef, {
    status: 'completed',
    completedAt: new Date() // Opcional: Salvar a data que terminou
  });
};