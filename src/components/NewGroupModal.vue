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
            <ChatAvatar
              :name="user.nom + ' ' + user.prenoms"
              size="sm"
            />
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
.selected-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
  min-height: 40px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
}

.selected-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 6px 10px;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 500;
}

.remove-contact {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  font-size: 14px;
}

.remove-contact:hover:not(:disabled) {
  background: #ff4444;
  color: white;
}

.contact-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.contact-item.selected .contact-checkbox {
  background: #764ba2;
  border-color: #764ba2;
}
</style>
