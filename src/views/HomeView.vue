<template>
  <div class="body">
    <div class="chat-container">
      <!-- Sidebar des conversations -->
      <ConversationList
        :conversations="chat.conversations"
        :active-conv="chat.activeConv"
        :current-user-id="user.user.id"
        @select-conv="setActiveConv"
        @new-chat="showNewChatModal"
        @new-group="showNewGroupModal"
        @group-details="showGroupDetails"
        @logout="user.logout"
      />

      <!-- Zone de conversation active -->
      <ChatArea
        :active-conv="chat.activeConv"
        :current-user-id="user.user.id"
        :online-users="socket.usersConnected"
        @send-message="sendMessage"
        @new-chat="showNewChatModal"
        @new-group="showNewGroupModal"
        @show-details="showGroupDetails"
        @message-read="markMessageAsRead"
      />
    </div>

    <!-- Modals existants -->
    <NewChatModal
      :is-visible="showNewChat"
      :users="chat.users"
      :is-loading="chat.isLoadingNewConv"
      @close="closeNewChatModal"
      @start-chat="newChatConv"
    />

    <NewGroupModal
      :is-visible="showNewGroup"
      :users="chat.users"
      :is-loading="chat.isLoadingNewGroup"
      @close="closeNewGroupModal"
      @create-group="newGroup"
    />

    <!-- Nouveau modal pour les détails du groupe -->
    <GroupDetailsModal
      :is-visible="showGroupDetail"
      :group="selectedGroup"
      :all-users="chat.users"
      @close="closeGroupDetails"
      @update-name="updateGroupName"
      @add-member="addGroupMember"
      @mute-member="muteGroupMember"
      @ban-member="banGroupMember"
    />
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import {useUserStore} from '@/stores/userStore.js';
import {useSocketStore} from '@/stores/socket.js';
import {useChatStore} from '@/stores/chat.js';

// Composants
import ConversationList from '@/components/ConversationList.vue';
import ChatArea from '@/components/ChatArea.vue';
import NewChatModal from '@/components/NewChatModal.vue';
import NewGroupModal from '@/components/NewGroupModal.vue';
import GroupDetailsModal from '@/components/GroupDetailsModal.vue';

const user = useUserStore();
const chat = useChatStore();
const socket = useSocketStore();

// États UI
const showNewChat = ref(false);
const showNewGroup = ref(false);
const showGroupDetail = ref(false);
const selectedGroup = ref(null);

// Méthodes de gestion de conversation
const setActiveConv = async (conv) => {
  chat.activeConv = conv;

  // Marquer les messages comme lus
  if (conv.unread > 0) {
    const unreadMessages = conv.Messages.slice(0, conv.unread);
    for (const msg of unreadMessages) {
      await chat.markMessageAsRead(msg.id, conv.id);
    }
  }
};

const sendMessage = async (message) => {
  if (!message.trim() || !chat.activeConv) return;

  await chat.sendMessage(chat.activeConv, message);
};

const markMessageAsRead = async (data) => {
  await chat.markMessageAsRead(data.messageId, data.conversationId);
};

// Méthodes modals
const showNewChatModal = () => showNewChat.value = true;
const closeNewChatModal = () => showNewChat.value = false;

const showNewGroupModal = () => showNewGroup.value = true;
const closeNewGroupModal = () => showNewGroup.value = false;

const showGroupDetails = (group) => {
  selectedGroup.value = group;
  showGroupDetail.value = true;
};

const closeGroupDetails = () => {
  showGroupDetail.value = false;
  selectedGroup.value = null;
};

// Méthodes pour groupes (à implémenter)
const updateGroupName = (data) => {
  console.log('Update group name:', data);
  // À implémenter: chat.updateGroupName(data.groupId, data.newName)
};

const addGroupMember = (data) => {
  console.log('Add group member:', data);
  // À implémenter: chat.addGroupMember(data.groupId, data.userId)
};

const muteGroupMember = (data) => {
  console.log('Mute group member:', data);
  // À implémenter: chat.muteGroupMember(data.groupId, data.userId)
};

const banGroupMember = (data) => {
  console.log('Ban group member:', data);
  // À implémenter: chat.banGroupMember(data.groupId, data.userId)
};

// Méthodes existantes (à garder pour compatibilité)
const newChatConv = async (userId) => {
  // Logique existante...
};

const newGroup = async (groupData) => {
  // Logique existante...
};

// Initialisation
onMounted(async () => {
  if (!socket.socket) await socket.connect(user.token);
  socket.setupEventHandlers();

  await chat.fetchConversations();
  await chat.fetchUsers();
});
</script>

<style>
/* Importez les DEUX fichiers */
@import 'Home/Home.style.css';
/* Styles existants */
@import 'components.css'; /* Nouveaux styles */
</style>
