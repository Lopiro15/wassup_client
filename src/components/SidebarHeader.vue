<template>
  <div class="sidebar-header">
    <div class="user-info">
      <ChatAvatar :name="userDisplayName" size="md" />
      <div class="user-details">
        <h3>{{ user.username }}</h3>
        <p>En ligne</p>
      </div>
    </div>

    <div class="header-actions">
      <button class="icon-btn" @click="$emit('new-group')" title="Créer un groupe">
        <i class="fas fa-users"></i>
      </button>
      <button class="icon-btn" @click="$emit('new-chat')" title="Nouvelle discussion">
        <i class="fas fa-comment-medical"></i>
      </button>
      <button class="icon-btn" @click="$emit('logout')" title="Déconnexion">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ChatAvatar from './ChatAvatar.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

defineEmits(['new-chat', 'new-group', 'logout']);

const userDisplayName = computed(() => {
  return `${props.user.nom} ${props.user.prenoms}`;
});
</script>
