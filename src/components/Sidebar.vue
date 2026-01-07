<script setup>

import {formatDateLabel, getConvName, getInitialAllNames, truncateWords} from "@/utils/services.js";
import {computed, ref, watch} from "vue";
import {useUserStore} from "@/stores/userStore.js";
import {useChatStore} from "@/stores/chat.js";
import $ from "jquery";


const user = useUserStore()
const chat = useChatStore()

const initial = computed(() => {
  return user.user.nom[0] + user.user.prenoms[0]
})

const searchConv = ref("")

const emit = defineEmits([
  'show-new-group-modal',
  'show-new-chat-modal'
]);

function showNewGroupModal() {
  emit("show-new-group-modal");
}

function showNewChatModal() {
  emit("show-new-chat-modal")
}


function filterConversations(val) {
  const searchQuery = val.toLowerCase();
  const conversationItems = document.querySelectorAll('.conversation-item');

  conversationItems.forEach(item => {
    const name = item.querySelector('h4').textContent.toLowerCase();
    if (name.includes(searchQuery)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

watch(searchConv, (value) => {
  filterConversations(value)
})

function setActiveConv(conv) {

  $('.conversation-item').each(function () {
    $(this).removeClass('active');
  });

  const selectedItem = $(`.conversation-item[data-id="${conv.id}"]`);
  if (selectedItem) {
    selectedItem.addClass('active');
  }
  chat.activeConv = conv;
  if (conv.unread > 0) {
    for (let i = 0; i < conv.unread; i++) {
      chat.markMessageAsRead(conv.Messages[i].id, conv.id);
      const tab = JSON.parse(conv.Messages[i].readBy || "[]") || [];
      tab.push(user.user.id);
      conv.Messages[i].readBy = JSON.stringify(tab);
    }
  }
}

</script>

<template>
  <div class="conversations-sidebar">
    <div class="sidebar-header">
      <div class="user-info">
        <div class="avatar" id="userAvatar">{{ initial }}</div>
        <div class="user-details">
          <h3 id="userName">{{ user.user.username }}</h3>
          <p>En ligne</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="newGroupBtn" @click="showNewGroupModal"
                title="Créer un groupe">
          <i class="fas fa-users"></i>
        </button>
        <button class="icon-btn" id="newChatBtn" @click="showNewChatModal"
                title="Nouvelle discussion">
          <i class="fas fa-comment-medical"></i>
        </button>
        <button class="icon-btn" id="logoutBtn" @click="user.logout" title="Déconnexion">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions">
      <button class="action-btn" id="quickNewChat" @click="showNewChatModal">
        <i class="fas fa-user-plus"></i>
        <span>Nouvelle discussion</span>
      </button>
      <button class="action-btn" id="quickNewGroup" @click="showNewGroupModal">
        <i class="fas fa-users"></i>
        <span>Créer un groupe</span>
      </button>
    </div>

    <div class="search-box">
      <div class="input-with-icon">
        <i class="fas fa-search"></i>
        <input type="text" id="searchConversations"
               v-model="searchConv"
               placeholder="Rechercher une conversation...">
      </div>
    </div>

    <div class="conversations-list" id="conversationsList">
      <div class="empty-state" v-if="chat.conversations?.length === 0">
        <i class="fas fa-comments"></i>
        <p>Aucune conversation</p>
        <small>Commencez une nouvelle discussion</small>
      </div>

      <div class="conversation-item" v-for="(conv, index) in chat.conversations" :key="index"
           :data-id="conv.id" @click="setActiveConv(conv)">
        <div class="conversation-avatar">{{ getInitialAllNames(getConvName(conv, user.user)) }}</div>
        <div class="conversation-details">
          <h4>
            <i class="fas fa-users" v-if="conv.name"
               style="margin-right: 5px; font-size: 12px;"></i>
            {{ getConvName(conv, user.user) }}
          </h4>
          <p>{{ truncateWords(conv.Messages[0]?.contenu || "") }}</p>
        </div>
        <div class="conversation-meta">
          <div class="conversation-time">
            {{ formatDateLabel(conv.Messages[0]?.createdAt || conv.createdAt) }}
          </div>
          <div class="unread-count" v-if="conv.unread > 0">{{ conv.unread }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './../views/Home/Home.style.css';
</style>
