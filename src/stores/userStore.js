import {defineStore} from 'pinia'
import {ref} from 'vue'
import axios from "axios";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  decryptPrivateKey,
  generateEncryptedKeys
} from "../utils/keysManagement.js";
import {useSocketStore} from "@/stores/socket.js";
import {useAxiosStore} from "@/stores/axios.js";
import {useChatStore} from "@/stores/chat.js";
import router from "@/router/index.js";

export const useUserStore = defineStore('user', () => {
  const user = ref({})
  const token = ref(null)
  const privateKey = ref(null)
  const isLoadingLogin = ref(false)
  const errorLogin = ref(null)
  const isLoadingRegistration = ref(false)
  const errorRegistration = ref(null)

  const socketStore = useSocketStore();
  const env = import.meta.env;

  const api = useAxiosStore().api;

  const login = async (username, password) => {
    isLoadingLogin.value = true;
    try {
      const response = await api.post(`/auth/login`, {
        username,
        password
      });
      token.value = response.data.token;
      user.value = response.data.user;
      const privateJson = JSON.parse(user.value.privateKeyEnc)
      privateKey.value = await decryptPrivateKey(privateJson.privateKey, password, privateJson.salt, privateJson.iv)
      try {
        const rep = await socketStore.connect(token.value);
        errorLogin.value = null
        isLoadingLogin.value = false;
      } catch (e) {
        errorLogin.value = "Une erreur s'est produite"
        isLoadingLogin.value = false;
      }

    } catch (e) {
      console.log(e)
      isLoadingLogin.value = false;
      if (e.response?.status === 401) {
        errorLogin.value = "Identifiants invalides"
      } else if(e.response?.status === 402) {
        errorLogin.value = "Utilisateur déjà connecté sur autre appareil"
      } else {
        errorLogin.value = "Une erreur s'est produite veuillez réessayez"
      }
      return false
    }
    return true;
  }

  const registration = async (username, nom, prenoms, telephone, password) => {
    isLoadingRegistration.value = true;
    const keys = await generateEncryptedKeys(password)

    const privateJson = JSON.stringify({
      privateKey: keys.privateKeyEnc,
      salt: keys.salt,
      iv: keys.iv
    })

    try {
      const response = await api.post("/auth/register", {
        username,
        nom,
        prenoms,
        telephone,
        password,
        publicPersoKey: keys.publicKey,
        privateKeyEnc: privateJson
      })
      token.value = response.data.token;
      user.value = response.data.user;
      privateKey.value = await decryptPrivateKey(keys.privateKeyEnc, password, keys.salt, keys.iv)
      try {
        const rep = await socketStore.connect(token.value);
        errorLogin.value = null
        isLoadingLogin.value = false;
      } catch (e) {
        errorLogin.value = "Une erreur s'est produite"
        isLoadingLogin.value = false;
      }
    } catch (e) {
      isLoadingRegistration.value = false
      if (e.response?.status === 400) {
        errorRegistration.value = e.response?.data.message;
        console.log(e.response)
      } else {
        errorRegistration.value = "Une erreur s'est produite. Veuillez réessayer"
        console.log(e)
      }
      return false
    }
    return true
  }

  const logout = async () => {

    // 2. Réinitialiser les autres stores
    const chatStore = useChatStore()
    const socketStore = useSocketStore()

    user.value = {}
    token.value = null
    privateKey.value = null
    isLoadingLogin.value = false
    errorLogin.value = null
    isLoadingRegistration.value = false
    errorRegistration.value = null


    chatStore.reset()
    socketStore.disconnect()
    socketStore.$reset()

    sessionStorage.clear()
    await router.push('/login')
  }

  return {
    user,
    token,
    isLoadingLogin,
    isLoadingRegistration,
    errorLogin,
    errorRegistration,
    privateKey,
    login,
    registration,
    logout
  }
}, {
  persist: {
    key: 'user',
    storage: sessionStorage,
    paths: ['user', 'token'],
    afterRestore: (ctx) => {
      // Après restauration, convertir le privateKey base64 en ArrayBuffer si présent
      if (ctx.store.privateKey && typeof ctx.store.privateKey === 'string') {
        ctx.store.privateKey = base64ToArrayBuffer(ctx.store.privateKey);
      }
    },
    serializer: {
      serialize: (state) => {
        // Convertir privateKey (ArrayBuffer) en base64 avant sérialisation
        const stateToPersist = {
          user: state.user,
          token: state.token,
          privateKey: state.privateKey ? arrayBufferToBase64(state.privateKey) : null
        };
        return JSON.stringify(stateToPersist);
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        if (parsed.privateKey && typeof parsed.privateKey === 'string') {
          parsed.privateKey = base64ToArrayBuffer(parsed.privateKey);
        }
        // La conversion de base64 vers ArrayBuffer se fait dans afterRestore
        return parsed;
      }
    }
  }
});
