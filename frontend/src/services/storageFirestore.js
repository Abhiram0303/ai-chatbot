import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, app } from '../firebase';

const storage = app ? getStorage(app) : null;

/**
 * Uploads a file to Firebase Storage and saves metadata to Firestore users/{uid}/files/{fileId}.
 */
export async function uploadUserFile(uid, file, onProgress) {
  if (!uid || !file) throw new Error('User and file are required.');

  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `users/${uid}/files/${fileId}_${file.name}`;

  let downloadURL = '';

  // Attempt Firebase Storage upload if storage is initialized
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    } catch (err) {
      console.warn('Firebase Storage upload warning:', err.message);
    }
  }

  // Save metadata to Firestore users/{uid}/files/{fileId}
  if (db) {
    try {
      const fileDocRef = doc(db, 'users', uid, 'files', fileId);
      await setDoc(fileDocRef, {
        name: file.name,
        type: file.name.split('.').pop().toUpperCase() || 'FILE',
        size: file.size,
        storagePath: storagePath,
        downloadURL: downloadURL || '#',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore file metadata write warning:', err.message);
    }
  }

  return {
    id: fileId,
    name: file.name,
    type: file.name.split('.').pop().toUpperCase() || 'FILE',
    size: file.size,
    downloadURL: downloadURL || '#',
    createdAt: new Date(),
  };
}

/**
 * Fetches all files for a user from Firestore.
 */
export async function getUserFiles(uid) {
  if (!db || !uid) return [];
  try {
    const filesRef = collection(db, 'users', uid, 'files');
    const q = query(filesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        type: data.type,
        size: data.size,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });
  } catch (err) {
    console.error('Failed to fetch user files from Firestore:', err);
    return [];
  }
}

/**
 * Deletes a file from Firebase Storage and Firestore.
 */
export async function deleteUserFile(uid, fileItem) {
  if (!uid || !fileItem) return;

  // Delete from Storage
  if (storage && fileItem.storagePath) {
    try {
      const storageRef = ref(storage, fileItem.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Firebase Storage delete warning:', err.message);
    }
  }

  // Delete from Firestore
  if (db && fileItem.id) {
    try {
      const fileDocRef = doc(db, 'users', uid, 'files', fileItem.id);
      await deleteDoc(fileDocRef);
    } catch (err) {
      console.warn('Firestore file delete warning:', err.message);
    }
  }
}
