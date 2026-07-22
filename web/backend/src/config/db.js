import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let db;
let isFallback = false;

const DB_DIR = path.resolve('.local_db');

// Custom File-based Mock Database for developer fallback
class MockDocRef {
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.docId = docId;
    this.filePath = path.join(DB_DIR, `${collectionName}.json`);
  }

  get id() {
    return this.docId;
  }

  _readCollection() {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  _writeCollection(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async get() {
    const data = this._readCollection();
    const docData = data[this.docId];
    return {
      exists: !!docData,
      id: this.docId,
      data: () => docData ? { ...docData, id: this.docId } : undefined
    };
  }

  async set(newData, options = {}) {
    const data = this._readCollection();
    if (options.merge && data[this.docId]) {
      data[this.docId] = { ...data[this.docId], ...newData, id: this.docId };
    } else {
      data[this.docId] = { ...newData, id: this.docId };
    }
    this._writeCollection(data);
    return { id: this.docId };
  }

  async update(newData) {
    const data = this._readCollection();
    if (!data[this.docId]) {
      throw new Error(`Document ${this.docId} not found in ${this.collectionName}`);
    }
    data[this.docId] = { ...data[this.docId], ...newData, id: this.docId };
    this._writeCollection(data);
    return { id: this.docId };
  }

  async delete() {
    const data = this._readCollection();
    if (data[this.docId]) {
      delete data[this.docId];
      this._writeCollection(data);
    }
    return { id: this.docId };
  }
}

class MockCollectionRef {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DB_DIR, `${collectionName}.json`);
    this.filters = [];
  }

  _readCollection() {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  _writeCollection(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  doc(id) {
    const docId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocRef(this.collectionName, docId);
  }

  where(field, operator, value) {
    const query = new MockCollectionRef(this.collectionName);
    query.filters = [...this.filters, { field, operator, value }];
    return query;
  }

  async add(newData) {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = this.doc(id);
    await docRef.set(newData);
    return docRef;
  }

  async get() {
    const data = this._readCollection();
    let docs = Object.keys(data).map(id => ({
      id,
      data: () => ({ ...data[id], id }),
      exists: true
    }));

    // Apply filters
    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const val = doc.data()[filter.field];
        if (filter.operator === '==') return val === filter.value;
        if (filter.operator === '!=') return val !== filter.value;
        if (filter.operator === '>') return val > filter.value;
        if (filter.operator === '>=') return val >= filter.value;
        if (filter.operator === '<') return val < filter.value;
        if (filter.operator === '<=') return val <= filter.value;
        if (filter.operator === 'array-contains') return Array.isArray(val) && val.includes(filter.value);
        return false;
      });
    }

    return {
      docs,
      empty: docs.length === 0,
      forEach: (callback) => docs.forEach(callback)
    };
  }
}

class MockDb {
  collection(name) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    return new MockCollectionRef(name);
  }
}

// Check if Firebase admin variables are available
const hasFirebaseEnv = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseEnv) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    db = admin.firestore();
    console.log('Successfully connected to Firebase Firestore.');
  } catch (error) {
    console.warn('Firebase Admin failed to initialize. Falling back to local file-based database.', error);
    db = new MockDb();
    isFallback = true;
  }
} else {
  console.log('Firebase env credentials missing. Using local JSON database fallback at .local_db/');
  db = new MockDb();
  isFallback = true;
}

export { db, isFallback };
