<template>
  <div class="modal" :class="{ active: isVisible }">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Créer un nouveau groupe</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="groupName">Nom du groupe</label>
          <input
            type="text"
            id="groupName"
            v-model="groupName"
            placeholder="Entrez le nom du groupe..."
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="groupSearch">Ajouter des membres</label>
          <div class="input-with-icon">
            <i class="fas fa-search"></i>
            <input
              type="text"
              id="groupSearch"
              v-model="searchQuery"
              placeholder="Rechercher des contacts..."
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="selected-contacts" v-if="selectedUsers.length > 0">
          <div
            v-for="user in selectedUsers"
            :key="user.id"
            class="selected-contact"
          >
            <span>{{ user.nom + " " + user.prenoms }}</span>
            <button
              class="remove-contact"
              @click="removeUser(user)"
              :disabled="isLoading"
            >
              &times;
            </button>
          </div>
        </div>

        <div class="contacts-list">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="contact-item"
            :class="{ selected: isUserSelected(user) }"
            @click="toggleUser(user)"
          >
            <div class="contact-avatar">{{ getInitialAllNames(user.nom + " " + user.prenoms) }}</div>

            <div class="contact-info">
              <h4>{{ user.nom + " " + user.prenoms }}</h4>
              <p>{{ user.username }}</p>
            </div>
            <div class="contact-checkbox">
              {{ isUserSelected(user) ? '✓' : '' }}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close" :disabled="isLoading">
          Annuler
        </button>
        <button
          class="btn btn-primary"
          @click="createGroup"
          :disabled="!canCreate || isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span v-else>Créer le groupe</span>
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

const emit = defineEmits(['close', 'create-group']);

const groupName = ref('');
const searchQuery = ref('');
const selectedUsers = ref([]);

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return props.users;

  const query = searchQuery.value.toLowerCase();
  return props.users.filter(user => {
    const fullName = (user.nom + ' ' + user.prenoms).toLowerCase();
    const username = user.username.toLowerCase();
    return fullName.includes(query) || username.includes(query);
  });
});

const canCreate = computed(() => {
  return groupName.value.trim().length > 0 && selectedUsers.value.length > 0;
});

const isUserSelected = (user) => {
  return selectedUsers.value.some(u => u.id === user.id);
};

const toggleUser = (user) => {
  if (isUserSelected(user)) {
    selectedUsers.value = selectedUsers.value.filter(u => u.id !== user.id);
  } else {
    selectedUsers.value.push(user);
  }
};

const removeUser = (user) => {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== user.id);
};

const createGroup = () => {
  if (!canCreate.value) return;

  const groupData = {
    name: groupName.value.trim(),
    members: selectedUsers.value.map(u => u.id)
  };

  emit('create-group', groupData);
};

const close = () => {
  groupName.value = '';
  searchQuery.value = '';
  selectedUsers.value = [];
  emit('close');
};
</script>

<style scoped>
@import './../views/Home/Home.style.css';
</style>
