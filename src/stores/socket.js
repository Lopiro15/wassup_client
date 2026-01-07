// stores/socket.js
import {defineStore} from 'pinia'
import {ref} from 'vue'
import {io} from 'socket.io-client'
import {ACTIONS} from "@/utils/messageTypes.js";
import {DiffieHellman} from "@/utils/cryptoService.js";
import debugLib from "debug";
import {useToast} from "vue-toastification"
import {useChatStore} from "@/stores/chat.js";
import $ from "jquery";


const debug = debugLib('client');

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const chat = useChatStore()
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const dhClient = ref(new DiffieHellman());
  const usersConnected = ref([]);
  const toast = useToast()

  const connect = (token) => {
    return new Promise((resolve, reject) => {
      socket.value = io('http://localhost:3000', {
        auth: {
          token: token
        },
      })

      socket.value.once('authenticated', async (data) => {
        await dhClient.value.init();
        startEncryptionHandshake(socket)
      })

      const startEncryptionHandshake = (socket) => {
        socket.value.emit('ecdh', {
          action: ACTIONS.CLIENT_HELLO
        });
        const timeoutId = setTimeout(() => {
          socket.value.removeListener('ecdh', dataHandler);
          reject({status: false, error: "Erreur d'encryption session"})
        }, 30000);
        const dataHandler = async (data) => {
          try {
            const received = data;

            if (received.type === ACTIONS.SERVER_INIT) {
              clearTimeout(timeoutId);
              console.log('🔄 Établissement du chiffrement ECDH...');

              const publicKey = received.publicKey;

              console.log("clé serveur:" + publicKey)

              const secret = await dhClient.value.computeSecret(publicKey);

              console.log('✅ Secret partagé ECDH établi: ' + secret);

              // Envoi de notre clé publique au serveur
              const clientPubKeyHex = await dhClient.value.getPublicKey();
              socket.value.emit('ecdh', {
                publicKey: clientPubKeyHex,
                action: ACTIONS.CLIENT_PUBLIC_KEY
              });
            } else if (received.type === ACTIONS.SERVER_RECEIVED_KEY) {
              socket.value.removeListener('ecdh', dataHandler);
              console.log('🔐 Canal sécurisé établi');
              resolve({status: true})
            } else if (received.type === ACTIONS.ENCRYPTED) {
              // Gérer les messages encryptés pendant l'établissement
              try {
                const decrypted = dhClient.value.decrypt(received.payload);
                const msg = JSON.parse(decrypted);
                if (msg.action === ACTIONS.SERVER_ERROR) {
                  clearTimeout(timeoutId);
                  socket.value.removeListener('event', dataHandler);
                  reject(new Error(msg.msg || 'Erreur du serveur'));
                }
              } catch (error) {
                // Ignorer les erreurs de décryptage pendant l'établissement
              }
            }
          } catch (err) {
            debug('Erreur lors de l\'établissement DH:', err.message);
          }
        };

        socket.value.on('ecdh', dataHandler)
      }

      socket.value.on('disconnect', (reason) => {
        console.log('Socket.io déconnecté:', reason)
        isConnected.value = false

        if (reason === 'io server disconnect') {
          // Reconnexion manuelle nécessaire
          setTimeout(connect, 1000)
        }
      })

      socket.value.on('connect_error', (error) => {
        console.error('Erreur de connexion Socket.io:', error)
        isConnected.value = false

        reject({status: false, error: "Token invalide"})
      })

    })

  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const emit = (event, data) => {
    if (socket.value) {
      socket.value.emit(event, data)
    }
  }

  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const setupEventHandlers = () => {
    if (socket.value) {
      socket.value.on("message", async (data) => await handleServerData(data))
      console.log("listening")
    }
  }

  async function handleServerData(data) {
    try {
      const rawMsg = data;
      let msg = rawMsg;

      // Décrypter le message si il est encrypté
      if (rawMsg.type === ACTIONS.ENCRYPTED) {
        const decryptedString = await dhClient.value.decrypt(rawMsg.payload)
        msg = JSON.parse(decryptedString);
        if (!msg) {
          console.log('Impossible de décrypter le message');
          return;
        }
      }

      // Traiter le message décrypté
      await processDecryptedMessage(msg);
    } catch (err) {
      console.log(`Erreur traitement message: ${err.message}`);
    }
  }

  async function processDecryptedMessage(msg) {
    const messageHandlers = {
      [ACTIONS.SERVER_FORWARD]: async () => {
        await receiveMessage(msg)
      },
      [ACTIONS.SERVER_GROUP_BROADCAST]: async () => {
        await receiveMessage(msg)
      },
      [ACTIONS.SERVER_NOTIFY_ME]: () => {
        if (msg.users) {
          usersConnected.value = msg.users
        }
      },
      [ACTIONS.SERVER_NOTIFY]: () => {
        toast.success(`${msg.msg}`)
        if (msg.users) {
          usersConnected.value = msg.users
        }
      },
      [ACTIONS.SERVER_NOTIFY_GROUP_ACTION]: async () => {
        await chat.fetchConversations();
      }
    };

    const handler = messageHandlers[msg.action];
    if (handler) {
      handler();
    } else {
      console.log(`Message inconnu: ${JSON.stringify(msg)}`);
    }
  }

  const receiveMessage = async (msg) => {
    console.log(msg)
    // Décrypter le message avant de l'ajouter
    const messageData = JSON.parse(msg.msgObject);
    await chat.fetchConversations();

    // activeConv.value
    if (chat.activeConv && chat.activeConv.id === msg.conv) {
      // chat.activeConv.Messages = [messageData, ...(chat.activeConv.Messages || [])]
      $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
    }
  }

  async function sendEncrypted(messageObj) {
    try {
      const encrypted = await dhClient.value.encrypt(JSON.stringify(messageObj));
      emit("message", {
        type: ACTIONS.ENCRYPTED,
        payload: encrypted
      })
    } catch (error) {
      console.error('❌ Erreur de chiffrement:', error.message);
    }
  }

  const off = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  function $reset() {
    disconnect()
    dhClient.value = new DiffieHellman()
  }

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
    $reset,
    setupEventHandlers,
    usersConnected,
    sendEncrypted
  }
}, {
  persist: {
    key: 'socket',
    storage: sessionStorage
  }
})
