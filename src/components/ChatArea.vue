<template>
  <div class="chat-area">
    <div class="chat-header" id="chatHeader">
      <div class="no-conversation" v-if="!chat.activeConv">
        <i class="fas fa-comments"></i>
        <h3>Sélectionnez une conversation</h3>
        <p>Choisissez une conversation dans la liste ou commencez une nouvelle discussion</p>
        <div class="action-buttons">
          <button class="btn btn-primary" id="startNewChatFromEmpty" @click="showNewChatModal">
            <i class="fas fa-user-plus"></i>
            Nouvelle discussion
          </button>
          <button class="btn btn-secondary" id="createGroupFromEmpty"
                  @click="showNewGroupModal">
            <i class="fas fa-users"></i>
            Créer un groupe
          </button>
        </div>
      </div>

      <div class="user-info" v-else>
        <div class="conversation-avatar">{{
            getInitialAllNames(getConvName(chat.activeConv, user.user))
          }}
        </div>
        <div class="user-details">
          <div class="header-top">
            <h3>{{ getConvName(chat.activeConv, user.user) }}</h3>
            <button
              v-if="chat.activeConv.name"
              class="icon-btn small"
              @click="showGroupDetails"
              title="Détails du groupe"
            >
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
          <p>
          <span v-if="chat.activeConv.name">
            {{ chat.activeConv.MembreConversations?.length || 0 }} membre(s)
          </span>
            <span v-else>
            <i
              class="fas fa-circle"
              :class="socket.usersConnected.includes(
                      getOtherMembreInPrivate(chat.activeConv, user.user).User.username
                    ) ? 'online' : 'offline'"
            ></i>
            {{
                socket.usersConnected.includes(
                  getOtherMembreInPrivate(chat.activeConv, user.user).User.username
                ) ? 'En ligne' : 'Hors Ligne'
              }}
          </span>
          </p>
        </div>
      </div>
    </div>

    <div class="chat-messages" id="chatMessages">
      <!-- Les messages seront générées dynamiquement -->
      <div v-for="(msg, index) in chat.activeConv?.Messages" :key="index"
           class="message"
           :class="{'system': msg.type === 'EVENT', 'sent': msg.senderId === user.user.id, 'received': (msg.senderId !== null && msg.senderId !== user.user.id)}"
           :data-id="msg.id ? msg.id : '0'">
        <div class="message-bubble">
          <strong
            v-if="msg.senderId !== null && msg.senderId !== user.user.id && msg.sender">
            {{ msg.sender.prenoms + ' ' + msg.sender.nom }}<br>
          </strong>
          {{ msg.contenu }}
          <div class="message-time">{{ formatDateLabel(msg.date_envoi) }}</div>
        </div>
      </div>
    </div>

    <div class="chat-input-area" id="chatInputArea" v-if="chat.activeConv && !isMuted && !isBanned">
      <div class="input-with-icon">
        <i class="fas fa-paperclip" style="box-sizing: content-box !important;"></i>
        <input type="text" v-model="message" id="messageInput"
               style="box-sizing: content-box !important;"
               placeholder="Tapez votre message...">
        <button class="send-btn" :disabled="!message" @click="sendMessage()"
                style="box-sizing: content-box !important;" id="sendMessage">
          <i class="fas fa-paper-plane"
             style="color: white; box-sizing: content-box !important;"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>

import {
  formatDateLabel,
  getInitialAllNames,
  getOtherMembreInPrivate,
  getConvName
} from "@/utils/services.js";
import {useChatStore} from "@/stores/chat.js";
import {computed, onMounted, ref, watch} from "vue";
import $ from "jquery";
import {useSocketStore} from "@/stores/socket.js";
import {useUserStore} from "@/stores/userStore.js";

const chat = useChatStore()

const user = useUserStore()

const socket = useSocketStore()

const message = ref("")

const emit = defineEmits([
  'show-new-group-modal',
  'show-new-chat-modal',
  'show-group-details'
]);

function showGroupDetails() {
  emit("show-group-details");
}

function showNewGroupModal() {
  emit("show-new-group-modal");
}

function showNewChatModal() {
  emit("show-new-chat-modal")
}

const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const msgId = entry.target.dataset.id;
      const msg = chat.activeConv.Messages.find(m => m.id == msgId);
      const index = chat.activeConv.Messages.findIndex(m => m.id == msgId);
      if (msg && !isMessageRead(msg)) {
        chat.activeConv.Messages[index].readBy.push(user.user.id)
        await chat.markMessageAsRead(msg.id, chat.activeConv.id);
      }
    }
  }
});

const isMessageRead = (msg) => {
  return (msg.readBy || []).includes(user.user.id) || msg.senderId === user.user.id;
};

function readMessage() {
// Observer tous les éléments avec la classe
  $('.received').each(function () {
    observer.observe(this);  // 'this' est l'élément DOM natif
  });
}

watch(chat.activeConv, () => {
  readMessage()
  $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
})

const isMuted = computed(() => {
  if (chat.activeConv && chat.activeConv.name) {
    return chat.activeConv.MembreConversations.some((mb) => mb.statut === "KICKED" && mb.User.id === user.user.id);
  } else {
    return false;
  }
})

const isBanned = computed(() => {
  if (chat.activeConv && chat.activeConv.name) {
    return chat.activeConv.MembreConversations.some((mb) => mb.statut === "BANNED" && mb.User.id === user.user.id);
  } else {
    return false;
  }
})

async function sendMessage() {
  await chat.sendMessage(chat.activeConv, message.value)
  message.value = ""
  $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
}

onMounted(() => {
  readMessage()
})
</script>

<style scoped>
@import './../views/Home/Home.style.css';
</style>
