<template>
  <div
    class="conversation-item"
    :class="{ active: isActive }"
    @click="$emit('click')"
    @contextmenu.prevent="showContextMenu"
  >
    <ChatAvatar
      :name="conversationName"
      :is-group="!!conversation.name"
      size="lg"
    />

    <div class="conversation-details">
      <div class="conversation-header">
        <h4>
          <i class="fas fa-users" v-if="conversation.name"></i>
          {{ conversationName }}
        </h4>
        <span class="conversation-time">
          {{ formatTime(conversation.lastMessageDate) }}
        </span>
      </div>

      <p class="last-message">
        {{ truncateMessage(lastMessageContent) }}
      </p>
    </div>

    <div class="conversation-meta">
      <div class="unread-count" v-if="unreadCount > 0">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
      <button
        v-if="conversation.name"
        class="icon-btn small"
        @click.stop="$emit('details')"
        title="Détails du groupe"
      >
        <i class="fas fa-ellipsis-v"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ChatAvatar from './ChatAvatar.vue';
import { truncateWords, formatDateLabel } from '@/utils/services.js';

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: Number,
    required: true
  }
});

defineEmits(['click', 'details']);

const conversationName = computed(() => {
  if (props.conversation.name) return props.conversation.name;

  const members = props.conversation.MembreConversations || [];
  const otherMember = members.find(m => m.User?.id !== props.currentUserId);
  return otherMember ? `${otherMember.User.nom} ${otherMember.User.prenoms}` : 'Conversation';
});

const lastMessage = computed(() => {
  return props.conversation.Messages?.[0] || {};
});

const lastMessageContent = computed(() => {
  return lastMessage.value.contenuDecrypte || lastMessage.value.contenu || '';
});

const lastMessageDate = computed(() => {
  return lastMessage.value.createdAt || props.conversation.createdAt;
});

const unreadCount = computed(() => {
  return props.conversation.unread || 0;
});

const formatTime = (dateString) => {
  return formatDateLabel(dateString);
};

const truncateMessage = (text) => {
  return truncateWords(text, 20);
};

const showContextMenu = (e) => {
  if (props.conversation.name) {
    // Afficher menu contextuel pour les groupes
    console.log('Show group context menu');
  }
};
</script>

<style scoped>
.conversation-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.conversation-item:hover {
  background: #f8f9fa;
}

.conversation-item.active {
  background: #e6f0ff;
  border-right: 3px solid #764ba2;
}

.conversation-details {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-header h4 {
  font-size: 14px;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-time {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.last-message {
  font-size: 12px;
  color: #777;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unread-count {
  background: #764ba2;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  font-weight: 600;
}

.icon-btn.small {
  width: 24px;
  height: 24px;
  font-size: 12px;
  background: transparent;
  color: #999;
}

.icon-btn.small:hover {
  background: #f0f0f0;
  color: #764ba2;
}
</style>
