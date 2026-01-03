// src/utils/keysManagement.js

export function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return { publicKey: arrayBufferToBase64(publicKey), privateKey };
}

export async function deriveAesKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(privateKeyArrayBuffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(password, salt);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, privateKeyArrayBuffer);

  return {
    privateKeyEnc: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  };
}

export async function decryptPrivateKey(privateKeyEnc, password, saltB64, ivB64) {
  const salt = base64ToArrayBuffer(saltB64);
  const iv = base64ToArrayBuffer(ivB64);
  const encryptedBuffer = base64ToArrayBuffer(privateKeyEnc);

  const aesKey = await deriveAesKey(password, salt);

  return await crypto.subtle.decrypt({name: "AES-GCM", iv}, aesKey, encryptedBuffer); // ArrayBuffer de la clé privée
}

export async function generateEncryptedKeys(password) {
  // 1. Générer clé publique / privée
  const { publicKey, privateKey } = await generateKeyPair();

  // 2. Chiffrer la clé privée avec AES dérivée du mot de passe
  const encrypted = await encryptPrivateKey(privateKey, password);

  return {
    publicKey,                // → string Base64
    privateKeyEnc: encrypted.privateKeyEnc, // → string Base64
    salt: encrypted.salt,     // → nécessaire pour déchiffrer
    iv: encrypted.iv          // → nécessaire pour AES-GCM
  };
}


/**
 * Chiffre un message avec une clé publique RSA
 * @param {string|ArrayBuffer} data - Données à chiffrer (texte ou ArrayBuffer)
 * @param {string} publicKeyB64 - Clé publique au format Base64 (SPKI)
 * @returns {Promise<string>} Données chiffrées en Base64
 */
export async function encrypt(data, publicKeyB64) {
  try {
    // Convertir la clé publique de Base64 à ArrayBuffer
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyB64);

    // Importer la clé publique
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["encrypt"]
    );

    // Préparer les données
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else if (data instanceof ArrayBuffer) {
      dataBuffer = data;
    } else {
      throw new Error("Les données doivent être une chaîne de caractères ou un ArrayBuffer");
    }

    // Chiffrer les données
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      dataBuffer
    );

    // Convertir en Base64
    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error("Erreur lors du chiffrement:", error);
    throw error;
  }
}

/**
 * Déchiffre un message avec une clé privée RSA
 * @param {string} encryptedDataB64 - Données chiffrées en Base64
 * @param {ArrayBuffer|CryptoKey} privateKey - Clé privée (ArrayBuffer ou CryptoKey)
 * @param {string} [password] - Mot de passe (si la clé privée est chiffrée)
 * @param {string} [saltB64] - Salt en Base64 (si la clé privée est chiffrée)
 * @param {string} [ivB64] - IV en Base64 (si la clé privée est chiffrée)
 * @returns {Promise<string>} Données déchiffrées en texte
 */
export async function decrypt(encryptedDataB64, privateKey) {
  try {
    let cryptoKey;

    cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["decrypt"]
    );

    // Convertir les données chiffrées de Base64 à ArrayBuffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedDataB64);

    // Déchiffrer les données
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      cryptoKey,
      encryptedBuffer
    );

    // Convertir en texte
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Erreur lors du déchiffrement:", error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour déchiffrer avec une clé privée stockée
 * @param {string} encryptedDataB64 - Données chiffrées en Base64
 * @param {Object} storedKeys - Clés stockées (comme retourné par generateEncryptedKeys)
 * @param {string} password - Mot de passe pour déchiffrer la clé privée
 * @returns {Promise<string>} Données déchiffrées
 */
export async function decryptWithStoredKeys(encryptedDataB64, storedKeys) {
  return decrypt(
    encryptedDataB64,
    storedKeys.privateKeyEnc
  );
}

/**
 * Fonction utilitaire pour chiffrer pour un destinataire spécifique
 * @param {string} data - Données à chiffrer
 * @param {Object} recipientKeys - Clés du destinataire
 * @returns {Promise<string>} Données chiffrées en Base64
 */
export async function encryptForRecipient(data, recipientKeys) {
  return encrypt(data, recipientKeys.publicKey);
}


// NOUVELLES FONCTIONS POUR CLÉS SYMÉTRIQUES

/**
 * Génère une clé AES symétrique
 * @returns {Promise<CryptoKey>} Clé AES
 */
export async function generateSymmetricKey() {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true, // exportable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exporte une clé symétrique en format texte JSON
 * @param {CryptoKey} key - Clé à exporter
 * @returns {Promise<string>} Clé exportée en format JSON
 */
export async function exportSymmetricKey(key) {
  const exported = await crypto.subtle.exportKey("raw", key);
  const keyData = arrayBufferToBase64(exported);

  return JSON.stringify({
    format: "raw",
    algorithm: { name: "AES-GCM", length: 256 },
    keyData: keyData,
    extractable: true,
    keyUsages: ["encrypt", "decrypt"]
  });
}

/**
 * Importe une clé symétrique depuis un format texte JSON
 * @param {string} keyJson - Clé au format JSON
 * @returns {Promise<CryptoKey>} Clé importée
 */
export async function importSymmetricKey(keyJson) {
  const keyData = JSON.parse(keyJson);
  const keyBuffer = base64ToArrayBuffer(keyData.keyData);

  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    {
      name: "AES-GCM",
      length: 256
    },
    keyData.extractable,
    keyData.keyUsages
  );
}

/**
 * Chiffre des données avec une clé symétrique
 * @param {string|ArrayBuffer} data - Données à chiffrer
 * @param {CryptoKey|string} key - Clé symétrique (CryptoKey ou JSON string)
 * @returns {Promise<string>} Données chiffrées + IV
 */
export async function encryptSymmetric(data, key) {
  let cryptoKey;

  // Si la clé est au format JSON, l'importer
  if (typeof key === 'string') {
    cryptoKey = await importSymmetricKey(key);
  } else {
    cryptoKey = key;
  }

  // Générer un IV aléatoire
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Préparer les données
  let dataBuffer;
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    dataBuffer = encoder.encode(data);
    console.log("bien encodé")
  } else {
    dataBuffer = data;
  }

  // Chiffrer
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    cryptoKey,
    dataBuffer
  );

  return JSON.stringify({
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv)
  });
}

/**
 * Déchiffre des données avec une clé symétrique
 * @param {string} encryptedDataB64 - Données chiffrées en Base64
 * @param {CryptoKey|string} key - Clé symétrique (CryptoKey ou JSON string)
 * @param {string} ivB64 - IV en Base64
 * @returns {Promise<string>} Données déchiffrées
 */
export async function decryptSymmetric(encryptedDataB64, key) {
  let cryptoKey;

  // Si la clé est au format JSON, l'importer
  if (typeof key === 'string') {
    cryptoKey = await importSymmetricKey(key);
  } else {
    cryptoKey = key;
  }

  // Convertir les données
  const data = JSON.parse(encryptedDataB64);
  const encryptedBuffer = base64ToArrayBuffer(data.encrypted);
  const iv = base64ToArrayBuffer(data.iv);

  // Déchiffrer
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    cryptoKey,
    encryptedBuffer
  );

  // Convertir en texte
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Génère et exporte une clé symétrique complète
 * @returns {Promise<{key: CryptoKey, keyJson: string}>}
 */
export async function generateAndExportSymmetricKey() {
  const key = await generateSymmetricKey();
  const keyJson = await exportSymmetricKey(key);
  return { key, keyJson };
}
