<template>
  <div class="modal" :class="{ active: isVisible }">
    <div class="modal-content group-details-modal">
      <div class="modal-header">
        <h3>Détails du groupe</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 1. Changer le nom du groupe -->
        <div class="detail-section">
          <h4>Nom du groupe</h4>
          <div class="name-editor">
            <input
              type="text"
              v-model="newGroupName"
              :disabled="!canEditName"
              placeholder="Nom du groupe"
            />
            <button
              class="btn btn-primary btn-sm"
              @click="updateGroupName"
              :disabled="!canSaveName || isLoading.name"
            >
              <span v-if="isLoading.name">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span v-else>Changer</span>
            </button>
          </div>
        </div>

        <!-- 2. Ajouter un membre -->
        <div class="detail-section">
          <h4>Ajouter un membre</h4>
          <div class="add-member">
            <select class="form-select" v-model="selectedUserToAdd" :disabled="isLoading.add">
              <option value="">Sélectionner un contact</option>
              <option
                v-for="user in availableUsers"
                :key="user.id"
                :value="user"
              >
                {{ user.nom }} {{ user.prenoms }}
              </option>
            </select>
            <button
              class="btn btn-primary btn-sm"
              @click="addMember"
              :disabled="!selectedUserToAdd || isLoading.add"
            >
              <span v-if="isLoading.add">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span v-else>Ajouter</span>
            </button>
          </div>
        </div>

        <!-- 3. Liste des membres avec actions -->
        <div class="detail-section">
          <h4>Membres ({{ groupMembers.length }})</h4>
          <div class="members-list">
            <div v-for="member in groupMembers" :key="member.id" class="member-item">
              <ChatAvatar
                :name="member.User.nom + ' ' + member.User.prenoms"
                size="sm"
              />
              <div class="member-info">
                <span class="member-name">{{ member.User.nom }} {{ member.User.prenoms }}</span>
                <span v-if="isAdmin(member.User)" class="admin-badge">Admin</span>
              </div>
              <div class="member-actions" v-if="!isAdmin(member.User)">
                <button
                  class="btn btn-danger btn-xs"
                  @click="grantMember(member)"
                  :disabled="isLoading.grant === member.id"
                  title="Mettre admin ce membre"
                >
                  <i class="fas fa-user"></i>
                </button>
                <button
                  class="btn btn-warning btn-xs"
                  @click="muteMember(member)"
                  :disabled="isLoading.mute === member.id"
                  title="Muter ce membre"
                >
                  <i class="fas" :class="isMuted(member) ? 'fa-volume-high' : 'fa-volume-mute'"></i>
                </button>
                <button
                  class="btn btn-danger btn-xs"
                  @click="banMember(member)"
                  :disabled="isLoading.ban === member.id"
                  title="Bannir ce membre"
                >
                  <i class="fas fa-ban"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="mt-2 d-flex justify-content-center">
            <button class="btn btn-danger" @click="leaveGroup">
            <span v-if="isLoading.leave">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span v-else>Quitter le groupe</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from 'vue';
import ChatAvatar from './ChatAvatar.vue';
import {useUserStore} from "@/stores/userStore.js";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  },
  allUsers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'close',
  'update-name',
  'add-member',
  'mute-member',
  'ban-member',
  'leave-group',
  'grant-member'
]);

const newGroupName = ref('');
const selectedUserToAdd = ref(null);
const isLoading = ref({
  name: false,
  add: false,
  mute: null,
  ban: null,
  leave: false,
  grant: null
});

const user = useUserStore();

const groupMembers = computed(() => {
  return props.group?.MembreConversations.filter(mb => mb.statut !== "BANNED") || [];
});

const availableUsers = computed(() => {
  const memberIds = groupMembers.value.map(m => m.User.id);
  return props.allUsers.filter(user => !memberIds.includes(user.id));
});

const canEditName = computed(() => {
  // Seuls les admins peuvent changer le nom
  const myMb = groupMembers.value.find(m => m.User.id === user.user.id)
  return (myMb && myMb.role === "admin"); // À adapter selon vos règles
});

const isAdmin = (user) => {
  const myMb = groupMembers.value.find(m => m.User.id === user.id)
  return (myMb && myMb.role === "admin");
}

const isMuted = (u) => {
  const myMb = groupMembers.value.find(m => m.User.id === u.User.id)
  return (myMb && myMb.statut === "KICKED")
}

const canSaveName = computed(() => {
  return newGroupName.value.trim() &&
    newGroupName.value !== props.group?.name;
});

watch(() => props.group, (newGroup) => {
  if (newGroup) {
    newGroupName.value = newGroup.name || '';
  }
}, {immediate: true});

function close() {
  emit('close');
  resetForm();
}

function resetForm() {
  newGroupName.value = '';
  selectedUserToAdd.value = null;
  isLoading.value = {name: false, add: false, mute: null, ban: null};
}

function updateGroupName() {
  if (!canSaveName.value) return;

  isLoading.value.name = true;
  emit('update-name', {
    groupId: props.group.id,
    newName: newGroupName.value.trim()
  });
  // Réinitialiser après un délai
  setTimeout(() => {
    isLoading.value.name = false;
  }, 1000);
}

function addMember() {
  if (!selectedUserToAdd.value) return;

  isLoading.value.add = true;
  emit('add-member', {
    group: props.group,
    user: selectedUserToAdd.value
  });

  // Réinitialiser après un délai
  setTimeout(() => {
    selectedUserToAdd.value = null;
    isLoading.value.add = false;
  }, 1000);
}

function muteMember(member) {
  if (!confirm(`Muter ${member.User.nom} ?`)) return;

  isLoading.value.mute = member.id;
  emit('mute-member', {
    group: props.group,
    user: member.User
  });

  setTimeout(() => {
    isLoading.value.mute = null;
  }, 1000);
}

function banMember(member) {
  if (!confirm(`Bannir définitivement ${member.User.nom} ?`)) return;

  isLoading.value.ban = member.id;
  emit('ban-member', {
    group: props.group,
    user: member.User
  });

  setTimeout(() => {
    isLoading.value.ban = null;
  }, 1000);
}

function grantMember(member) {
  if (!confirm(`Définir ${member.User.nom} en tant qu'admin ?`)) return;

  isLoading.value.ban = member.id;
  emit('grant-member', {
    group: props.group,
    user: member.User
  });

  setTimeout(() => {
    isLoading.value.grant = null;
  }, 1000);
}

function leaveGroup() {
  if (!confirm(`Quitter définitivement le groupe?`)) return;

  isLoading.value.leave = true;
  emit('leave-group', {
    group: props.group
  });

  setTimeout(() => {
    isLoading.value.leave = null;
  }, 1000);
}
</script>

<style scoped>
@import './../views/Home/Home.style.css';

.group-details-modal {
  max-width: 500px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.name-editor,
.add-member {
  display: flex;
  gap: 10px;
  align-items: center;
}

.name-editor input,
.add-member select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-sm {
  padding: 10px 16px;
  font-size: 13px;
}

.btn-xs {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border: none;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #c82333;
}

.members-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-weight: 500;
  font-size: 14px;
}

.admin-badge {
  background: #764ba2;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

.member-actions {
  display: flex;
  gap: 8px;
}
</style>
