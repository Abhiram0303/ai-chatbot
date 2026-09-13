import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Chat Firestore Service Module
 * Handles CRUD operations for users/{uid}/chats and users/{uid}/chats/{chatId}/messages
 */

/**
 * Subscribes in real-time to all chats for the given user, ordered by updatedAt descending.
 * Returns an unsubscribe function to clean up the listener.
 */
export function subscribeToUserChats(uid, onUpdate, onError) {
  if (!db || !uid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    const chatsRef = collection(db, 'users', uid, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chats = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const updatedAtDate = data.updatedAt?.toDate?.() || new Date();
          const createdAtDate = data.createdAt?.toDate?.() || new Date();
          return {
            id: docSnap.id,
            title: data.title || 'Untitled Conversation',
            updatedAt: updatedAtDate,
            createdAt: createdAtDate,
          };
        });

        // Client-side fallback sort to guarantee freshest first even during write latency
        chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        if (onUpdate) onUpdate(chats);
      },
      (err) => {
        console.error('[Firestore] onSnapshot error on users chats:', err.message);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[Firestore] Failed to subscribe to user chats:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fetches all chats for the given user, ordered by updatedAt descending.
 */
export async function getUserChats(uid) {
  if (!db || !uid) return [];
  try {
    const chatsRef = collection(db, 'users', uid, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const chats = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || 'Untitled Conversation',
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });

    chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return chats;
  } catch (err) {
    console.error('[Firestore] Failed to fetch user chats:', err.message);
    return [];
  }
}

/**
 * Creates a new chat document for the user.
 * If chatId is provided, uses it as the document ID (for pre-assigned IDs).
 */
export async function createChatDoc(uid, chatId, title) {
  if (!db || !uid) return chatId || `chat-${Date.now()}`;
  try {
    const chatsRef = collection(db, 'users', uid, 'chats');
    const newChatRef = chatId ? doc(db, 'users', uid, 'chats', chatId) : doc(chatsRef);

    await setDoc(newChatRef, {
      title: title || 'New Conversation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return newChatRef.id;
  } catch (err) {
    console.error('[Firestore] Failed to create chat doc:', err.message);
    return chatId || `chat-${Date.now()}`;
  }
}

/**
 * Saves a message document inside a chat's messages subcollection.
 * Uses setDoc with merge: true on the parent chat doc to touch updatedAt safely.
 */
export async function saveChatMessageDoc(uid, chatId, message) {
  if (!db || !uid || !chatId || !message) return;
  try {
    const msgRef = doc(collection(db, 'users', uid, 'chats', chatId, 'messages'));
    await setDoc(msgRef, {
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      isError: Boolean(message.isError),
    });

    // Touch parent chat document updatedAt timestamp safely
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    await setDoc(chatRef, {
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Failed to save message doc:', err.message);
  }
}

/**
 * Fetches all messages for a specific chat.
 * Guarantees chronological order from oldest to newest.
 */
export async function getChatMessages(uid, chatId) {
  if (!db || !uid || !chatId) return [];
  try {
    const msgsRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);

    const msgs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const rawDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
      return {
        id: docSnap.id,
        role: data.role,
        content: data.content,
        timestamp: rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestampRaw: rawDate.getTime(),
        isError: Boolean(data.isError),
      };
    });

    // Chronological sort fallback
    msgs.sort((a, b) => a.timestampRaw - b.timestampRaw);
    return msgs;
  } catch (err) {
    console.error('[Firestore] Failed to fetch chat messages:', err.message);
    return [];
  }
}

/**
 * Renames a chat document title.
 */
export async function renameChatDoc(uid, chatId, newTitle) {
  if (!db || !uid || !chatId) return;
  try {
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    await setDoc(chatRef, {
      title: newTitle.trim() || 'Untitled Conversation',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Failed to rename chat:', err.message);
    throw err;
  }
}

/**
 * Permanently deletes a chat document and ALL of its child message documents.
 * Uses writeBatch for clean atomic deletion.
 */
export async function deleteChatDoc(uid, chatId) {
  if (!db || !uid || !chatId) return;
  try {
    // 1. Fetch all child message documents in users/{uid}/chats/{chatId}/messages
    const messagesRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const messagesSnap = await getDocs(messagesRef);

    // 2. Perform batched deletion in chunks of 400 docs (Firestore limit is 500)
    let batch = writeBatch(db);
    let count = 0;

    for (const msgDoc of messagesSnap.docs) {
      batch.delete(msgDoc.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    // 3. Delete parent chat document users/{uid}/chats/{chatId}
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    batch.delete(chatRef);

    // 4. Commit remaining deletions
    await batch.commit();
  } catch (err) {
    console.error(`[Firestore] Delete warning for ${chatId}:`, err.message);
  }
}

