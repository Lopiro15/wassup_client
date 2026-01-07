import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAxiosStore } from "@/stores/axios.js";
import { useUserStore } from "@/stores/userStore.js";
import {
  decrypt,
  decryptSymmetric,
  encryptSymmetric,
  generateAndExportSymmetricKey
} from "@/utils/keysManagement.js";
import { useSocketStore } from "@/stores/socket.js";
import { ACTIONS } from "@/utils/messageTypes.js";

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const user = useUserStore();
  const socket = useSocketStore();
  const api = useAxiosStore().api;
  const isLoadingFetchConv = ref(false)
  const isLoadingNewConv = ref(false)
  const activeConv = ref(null)
  const users = ref([])
  const isLoadingNewGroup = ref(false);

  async function fetchConversations() {
    isLoadingFetchConv.value = true;
    try {
      const response = await api.get('/chat/conversations', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      conversations.value = response.data;
      conversations.value = await Promise.all(
        conversations.value.map(async (conv) => {
          if (!conv.Messages?.length) return conv;

          const filteredMessages = [];

          for (const msg of conv.Messages) {
            const keyVersionObj = conv.keys?.find(k => k.versionKeys === msg.key_version);
            if (keyVersionObj) {
              const decrypted = await decryptMessage(msg.contenu, keyVersionObj.keys);
              filteredMessages.push({
                ...msg,
                contenu: decrypted
              });
            }
          }

          return {
            ...conv,
            Messages: filteredMessages
          };
        })
      );

      if (activeConv.value) {
        activeConv.value = conversations.value.find(c => c.id === activeConv.value.id);
      }
    } catch (e) {
      console.log(e)
    } finally {
      isLoadingFetchConv.value = false
    }
  }

  async function fetchUsers() {
    try {
      const response = await api.get('/auth/users', {
        params: { id: user.user.id },
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      users.value = response.data
    } catch (e) {
      console.log(e)
    }
  }

  async function newConv(contact) {
    isLoadingNewConv.value = true;
    const key = await generateAndExportSymmetricKey();
    try {
      const response = await api.post('/chat/conversations/new/private', {
        memberId: contact,
        key: key.keyJson
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      activeConv.value = response.data;
    } catch (e) {
      console.log(e)
    } finally {
      isLoadingNewConv.value = false
    }
  }

  function getOtherMembreInPrivate(conv) {
    const membres = conv.MembreConversations;
    return membres.find(mc => mc.User.id !== user.user.id);
  }

  async function sendMessage(conv, message) {
    const key = await decrypt(conv.activekey.keys, user.privateKey)
    const encryptedMsg = await encryptSymmetric(message, key)
    const msgObject = {
      senderId: user.user.id,
      sender: user.user,
      contenu: message,
      date_envoi: (new Date).toISOString(),
      key_version: conv.activekey.versionKeys
    }

    conversations.value = conversations.value.map(cov => {
      if (cov.id === conv.id) {
        const updatedMessages = [msgObject, ...(cov.Messages || [])]
        return { ...cov, Messages: updatedMessages }
      }
      return cov
    })

    if (activeConv.value) {
      activeConv.value.Messages = [msgObject, ...(activeConv.value.Messages || [])]
    }

    if (conv.name) {
      await socket.sendEncrypted({
        sender: user.user.username,
        message: encryptedMsg,
        conv: conv.id,
        keyVersion: conv.activekey.versionKeys,
        action: ACTIONS.GROUP_BROADCAST
      })
    } else {
      const dest = getOtherMembreInPrivate(conv).User.username;
      await socket.sendEncrypted({
        sender: user.user.username,
        dest,
        msg: encryptedMsg,
        conv: conv.id,
        keyVersion: conv.activekey.versionKeys,
        action: ACTIONS.CLIENT_SEND
      })
    }
  }

  async function decryptMessage(message, key) {
    const keySym = await decrypt(key, user.privateKey)
    return await decryptSymmetric(message, keySym);
  }

  async function newGroup(name, contacts) {
    isLoadingNewGroup.value = true;
    const key = await generateAndExportSymmetricKey();
    try {
      const response = await api.post('/chat/conversations/new/group', {
        name: name,
        membersId: contacts,
        key: key.keyJson
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const conv = response.data;
      conv.Messages[0].contenu = await decryptSymmetric(conv.Messages[0].contenu, key.keyJson)
      activeConv.value = response.data;
    } catch (e) {
      console.log(e)
    } finally {
      isLoadingNewGroup.value = false
    }
  }

  async function changeGroupName(conv, name) {
    try {
      const message = `${user.user.username} a renommé le groupe : ${name}`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, key)
      const response = await api.post('/chat/conversations/edit/name', {
        id: conv.id,
        name: name,
        eventCreated: encryptedMsg,
        version: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data);
    } catch (e) {
      console.log(e)
    }
  }

  const isMuted = (conv, u) => {
    const myMb = conv.MembreConversations.find(m => m.User.id === u.id)
    return (myMb && myMb.statut === "KICKED")
  }

  async function toggleMute(conv, member) {
    try {
      const message = `${user.user.username} a ${isMuted(conv, member) ? 'réactivé' : 'muté'} le membre : ${member.username}`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, key)
      const response = await api.post('/chat/conversations/edit/togglekick', {
        id: conv.id,
        member: member.id,
        eventCreated: encryptedMsg,
        keyVersion: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data)
    } catch (e) {
      console.log(e)
    }
  }

  async function grant(conv, member) {
    try {
      const message = `${user.user.username} a nommé le membre : ${member.username} en tant que admin`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, key)
      const response = await api.post('/chat/conversations/edit/grant', {
        id: conv.id,
        member: member.id,
        eventCreated: encryptedMsg,
        keyVersion: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data)
    } catch (e) {
      console.log(e)
    }
  }

  async function ban(conv, member) {
    try {
      const newKey = await generateAndExportSymmetricKey();
      const message = `${user.user.username} a expulsé le membre : ${member.username} du groupe.`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, key)
      const response = await api.post('/chat/conversations/edit/ban', {
        id: conv.id,
        member: member.id,
        eventCreated: encryptedMsg,
        key: newKey.keyJson,
        keyVersion: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data, ACTIONS.GROUP_BAN, member.username)
    } catch (e) {
      console.log(e)
    }
  }

  async function leave(conv) {
    try {
      const newKey = await generateAndExportSymmetricKey();
      const message = `${user.user.username} a quitté le groupe.`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, key)
      const response = await api.post('/chat/conversations/edit/leave', {
        id: conv.id,
        eventCreated: encryptedMsg,
        key: newKey.keyJson,
        keyVersion: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data)
    } catch (e) {
      console.log(e)
    }
  }

  async function addMember(conv, member) {
    try {
      const newKey = await generateAndExportSymmetricKey();
      const message = `${user.user.username} a ajouté ${member.username}.`;
      const key = await decrypt(conv.activekey.keys, user.privateKey)
      const encryptedMsg = await encryptSymmetric(message, newKey.keyJson)
      const response = await api.post('/chat/conversations/edit/addMember', {
        conversationId: conv.id,
        memberId: member.id,
        eventCreated: encryptedMsg,
        key: newKey.keyJson,
        keyVersion: conv.activekey.versionKeys
      }, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      await fetchConversations();
      await notifygroup(response.data)
    } catch (e) {
      console.log(e)
    }
  }

  async function notifygroup(conv, action= undefined, dest= undefined) {
    await socket.sendEncrypted({
      sender: user.user.username,
      conv: conv.id,
      action: ACTIONS.GROUP_ACTION,
      typeaction: action,
      dest
    })
  }

  function reset() {
    conversations.value = []
    isLoadingFetchConv.value = false
    isLoadingNewConv.value = false
    activeConv.value = null
    users.value = []
    isLoadingNewGroup.value = false
  }

  const markMessageAsRead = async (messageId, conversationId) => {
    try {
      const response = await api.get(`/chat/conversations/message/${messageId}/read`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const msgObj = response.data;

      msgObj.contenu = await decryptMessage(
        msgObj.contenu,
        activeConv.value.activekey.keys
      );

      conversations.value = conversations.value.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            Messages: conv.Messages.map(msg =>
              msg.id === messageId
                ? msgObj
                : msg
            ),
            unread: conv.unread - 1
          };
        }
        return conv;
      });

      if (activeConv.value && activeConv.value.id === conversationId) {
        activeConv.value = {
          ...activeConv.value,
          Messages: activeConv.value.Messages.map(msg =>
            msg.id === messageId
              ? msgObj
              : msg
          ),
          unread: activeConv.value.unread - 1
        };
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  return {
    // State
    conversations,
    isLoadingFetchConv,
    isLoadingNewConv,
    activeConv,
    users,
    isLoadingNewGroup,

    // Methods
    fetchConversations,
    fetchUsers,
    newConv,
    sendMessage,
    decryptMessage,
    newGroup,
    changeGroupName,
    toggleMute,
    grant,
    ban,
    leave,
    addMember,
    reset,
    markMessageAsRead,
    getOtherMembreInPrivate,
    isMuted
  }
}, {
  persist: {
    key: 'chat',
    storage: sessionStorage
  }
})
