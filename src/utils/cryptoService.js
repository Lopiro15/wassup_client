// cryptoService.js
const ALGORITHM_DH = { name: "ECDH", namedCurve: "P-256" };
const ALGORITHM_AES = { name: "AES-GCM", length: 256 };
const ALGORITHM_DERIVE = { name: "ECDH", public: null };

export class DiffieHellman {
  constructor() {
    this.keyPair = null;
    this.sharedSecret = null;
    this.sessionKey = null;
  }

  async init() {
    // Générer une paire de clés ECDH
    this.keyPair = await crypto.subtle.generateKey(ALGORITHM_DH, true, ["deriveKey", "deriveBits"]);
  }

  async getPublicKey() {
    return arrayBufferToHex(
      await crypto.subtle.exportKey("raw", this.keyPair.publicKey)
    );
  }

  async computeSecret(publicKey) {

    try {
      // Le serveur envoie la clé en DER hex, mais nous devons l'importer en format brut
      const serverPublicKeyBuffer = hexToArrayBuffer(publicKey);

      // Importer la clé publique du serveur
      const serverPubKey = await crypto.subtle.importKey(
        "raw",
        serverPublicKeyBuffer,
        ALGORITHM_DH,
        false,
        []
      );

      // Dériver les bits bruts du secret
      const rawSecret = await crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: serverPubKey
        },
        this.keyPair.privateKey,
        256
      );

      // Utiliser HKDF pour dériver une clé de session (comme le serveur)
      this.sessionKey = await this.deriveHKDFKey(rawSecret);

      this.sharedSecret = this.sessionKey;
      return this.sessionKey;

    } catch (error) {
      console.error('Erreur computeSecret:', error);
      throw new Error('Échec du calcul du secret partagé: ' + error.message);
    }

  }

  async deriveHKDFKey(sharedSecret) {
    // Implémentation HKDF similaire à celle du serveur
    const salt = new Uint8Array(0); // Salt vide comme le serveur
    const info = new TextEncoder().encode('socket-session-key');

    // Étape 1: Extract
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      "HKDF",
      false,
      ["deriveBits"]
    );

    // Étape 2: Expand
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: salt,
        info: info,
        hash: "SHA-256"
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    // Créer une clé AES à partir des bits dérivés
    return await crypto.subtle.importKey(
      "raw",
      derivedBits,
      ALGORITHM_AES,
      true,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(data) {
    if (!this.sessionKey) throw new Error('Secret partagé non établi');

    try {
      const encodedMessage = new TextEncoder().encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(16));

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128
        },
        this.sessionKey,
        encodedMessage
      );

      // Web Crypto intègre l'authTag à la fin des données chiffrées
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
      const authTag = encryptedArray.slice(encryptedArray.length - 16);

      return {
        iv: arrayBufferToHex(iv),
        data: arrayBufferToHex(ciphertext), // 'data' au lieu de 'encrypted'
        authTag: arrayBufferToHex(authTag)
      };

    } catch (error) {
      console.error('Erreur chiffrement:', error);
      throw new Error('Échec du chiffrement: ' + error.message);
    }
  }

  async decrypt(encryptedData) {
    if (!this.sessionKey) throw new Error('Secret partagé non établi');

    try {
      const iv = hexToArrayBuffer(encryptedData.iv);
      const ciphertext = hexToArrayBuffer(encryptedData.data); // 'data' au lieu de 'encrypted'
      const authTag = hexToArrayBuffer(encryptedData.authTag);

      // Reconstituer le buffer complet (ciphertext + authTag)
      const completeCiphertext = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      completeCiphertext.set(new Uint8Array(ciphertext), 0);
      completeCiphertext.set(new Uint8Array(authTag), ciphertext.byteLength);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128
        },
        this.sessionKey,
        completeCiphertext
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Erreur déchiffrement:', error);
      throw new Error('Échec du déchiffrement: ' + error.message);
    }
  }
}

export function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToArrayBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}
