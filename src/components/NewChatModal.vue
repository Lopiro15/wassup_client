<template>
  <div class="modal" :class="{ active: isVisible }">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Nouvelle discussion</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="contactSearch">Rechercher un contact</label>
          <div class="input-with-icon">
            <i class="fas fa-search"></i>
            <input
              type="text"
              id="contactSearch"
              v-model="searchQuery"
              placeholder="Nom du contact..."
            />
          </div>
        </div>

        <div class="contacts-list">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="contact-item"
            :class="{ selected: selectedUser?.id === user.id }"
            @click="selectUser(user)"
          >
            <div class="contact-avatar">{{ getInitialAllNames(user.nom + " " + user.prenoms) }}</div>

            <div class="contact-info">
              <h4>{{ user.nom + " " + user.prenoms }}</h4>
              <p>{{ user.username }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Annuler</button>
        <button
          class="btn btn-primary"
          @click="startChat"
          :disabled="!selectedUser || isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span v-else>Commencer la discussion</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {getInitialAllNames} from "@/utils/services.js";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  users: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'start-chat']);

const searchQuery = ref('');
const selectedUser = ref(null);

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return props.users;

  const query = searchQuery.value.toLowerCase();
  return props.users.filter(user => {
    const fullName = (user.nom + ' ' + user.prenoms).toLowerCase();
    const username = user.username.toLowerCase();
    return fullName.includes(query) || username.includes(query);
  });
});

const selectUser = (user) => {
  selectedUser.value = user;
};

const startChat = () => {
  if (!selectedUser.value) return;
  emit('start-chat', selectedUser.value.id);
};

const close = () => {
  searchQuery.value = '';
  selectedUser.value = null;
  emit('close');
};
</script>

<style scoped>
@import './../views/Home/Home.style.css';
</style>
