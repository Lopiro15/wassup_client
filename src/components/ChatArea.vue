<template>
  <div class="chat-area">
    <ChatHeader
      v-if="activeConv"
      :conversation="activeConv"
      :current-user-id="currentUserId"
      :is-online="isOtherUserOnline"
      @show-details="$emit('show-details')"
    />

    <EmptyChatArea v-else @new-chat="$emit('new-chat')" @new-group="$emit('new-group')" />

    <MessagesList
      v-if="activeConv"
      :messages="activeConv.Messages"
      :current-user-id="currentUserId"
      :conversation-id="activeConv.id"
      @message-read="$emit('message-read', $event)"
    />

    <MessageInput
      v-if="activeConv"
      v-model="message"
      :disabled="!canSendMessage"
      @send="$emit('send-message', message)"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import ChatHeader from './ChatHeader.vue';
import EmptyChatArea from './EmptyChatArea.vue';
import MessagesList from './MessagesList.vue';
import MessageInput from './MessageInput.vue';

const props = defineProps({
  activeConv: {
    type: Object,
    default: null
  },
  currentUserId: {
    type: Number,
    required: true
  },
  onlineUsers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['send-message', 'new-chat', 'new-group', 'show-details', 'message-read']);

const message = ref('');

const canSendMessage = computed(() => {
  return message.value.trim().length > 0 && props.activeConv;
});

const isOtherUserOnline = computed(() => {
  if (!props.activeConv || props.activeConv.name) return false;

  const members = props.activeConv.MembreConversations || [];
  const otherMember = members.find(m => m.User?.id !== props.currentUserId);
  if (!otherMember) return false;

  return props.onlineUsers.includes(otherMember.User.username);
});
</script>
