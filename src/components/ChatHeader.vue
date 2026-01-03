<template>
  <div class="chat-header">
    <div class="user-info">
      <ChatAvatar
        :name="conversationName"
        :is-group="!!conversation.name"
        size="md"
      />
      <div class="user-details">
        <div class="header-top">
          <h3>{{ conversationName }}</h3>
          <button
            v-if="conversation.name"
            class="icon-btn small"
            @click="$emit('show-details')"
            title="Détails du groupe"
          >
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
        <p>
          <span v-if="conversation.name">
            {{ conversation.MembreConversations?.length || 0 }} membre(s)
          </span>
          <span v-else>
            <i
              class="fas fa-circle"
              :class="isOnline ? 'online' : 'offline'"
            ></i>
            {{ isOnline ? 'En ligne' : 'Hors ligne' }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ChatAvatar from './ChatAvatar.vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: Number,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

defineEmits(['show-details']);

const conversationName = computed(() => {
  if (props.conversation.name) return props.conversation.name;

  const members = props.conversation.MembreConversations || [];
  const otherMember = members.find(m => m.User?.id !== props.currentUserId);
  return otherMember ? `${otherMember.User.nom} ${otherMember.User.prenoms}` : 'Conversation';
});
</script>

<style scoped>
.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.user-details {
  margin-left: 15px;
  flex: 1;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.header-top h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.user-details p {
  font-size: 13px;
  color: #666;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fa-circle {
  font-size: 8px;
}

.fa-circle.online {
  color: #4caf50;
}

.fa-circle.offline {
  color: #999;
}

.icon-btn.small {
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.icon-btn.small:hover {
  background: #e0e0e0;
  color: #764ba2;
}
</style>
