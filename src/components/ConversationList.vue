<template>
  <div class="conversations-sidebar">
    <SidebarHeader  :user="user.user"/>

    <div class="quick-actions">
      <button class="action-btn" @click="$emit('new-chat')">
        <i class="fas fa-user-plus"></i>
        <span>Nouvelle discussion</span>
      </button>
      <button class="action-btn" @click="$emit('new-group')">
        <i class="fas fa-users"></i>
        <span>Créer un groupe</span>
      </button>
    </div>

    <div class="search-box">
      <div class="input-with-icon">
        <i class="fas fa-search"></i>
        <input type="text" v-model="searchQuery" placeholder="Rechercher une conversation...">
      </div>
    </div>

    <div class="conversations-list">
      <div class="empty-state" v-if="filteredConversations.length === 0">
        <i class="fas fa-comments"></i>
        <p v-if="searchQuery">Aucun résultat</p>
        <p v-else>Aucune conversation</p>
        <small>Commencez une nouvelle discussion</small>
      </div>

      <ConversationItem
        v-for="conv in filteredConversations"
        :key="conv.id"
        :conversation="conv"
        :is-active="activeConv?.id === conv.id"
        :current-user-id="currentUserId"
        @click="$emit('select-conv', conv)"
        @details="$emit('group-details', conv)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import SidebarHeader from './SidebarHeader.vue';
import ConversationItem from './ConversationItem.vue';
import {useUserStore} from "@/stores/userStore.js";

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeConv: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select-conv', 'new-chat', 'new-group', 'group-details']);

const searchQuery = ref('');

const user = ref(useUserStore());

const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) return props.conversations;

  const query = searchQuery.value.toLowerCase();
  return props.conversations.filter(conv => {
    const convName = conv.name || getConvName(conv);
    return convName.toLowerCase().includes(query) ||
      conv.Messages[0]?.contenu?.toLowerCase().includes(query);
  });
});

function getConvName(conv) {
  if (conv.name) return conv.name;
  const membres = conv.MembreConversations || [];
  const otherMember = membres.find(m => m.User?.id !== props.currentUserId); // UTILISER props.currentUserId
  return otherMember ? `${otherMember.User.nom} ${otherMember.User.prenoms}` : '';
}
</script>
