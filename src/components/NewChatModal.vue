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
            <ChatAvatar
              :name="user.nom + ' ' + user.prenoms"
              size="sm"
            />
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
import ChatAvatar from './ChatAvatar.vue';

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
.contacts-list {
  margin-top: 15px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  gap: 12px;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:hover {
  background: #f8f9fa;
}

.contact-item.selected {
  background: #e6f0ff;
  border-left: 3px solid #764ba2;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-info h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.contact-info p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #777;
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
