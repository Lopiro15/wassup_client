<template>
  <div class="body">
    <div class="chat-container">
      <!-- Sidebar des conversations -->
      <div class="conversations-sidebar">
        <div class="sidebar-header">
          <div class="user-info">
            <div class="avatar" id="userAvatar">{{ getInitial() }}</div>
            <div class="user-details">
              <h3 id="userName">{{ user.user.username }}</h3>
              <p>En ligne</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-btn" id="newGroupBtn" @click="showNewGroupModal"
                    title="Créer un groupe">
              <i class="fas fa-users"></i>
            </button>
            <button class="icon-btn" id="newChatBtn" @click="showNewChatModal"
                    title="Nouvelle discussion">
              <i class="fas fa-comment-medical"></i>
            </button>
            <button class="icon-btn" id="logoutBtn" @click="user.logout" title="Déconnexion">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="quick-actions">
          <button class="action-btn" id="quickNewChat" @click="showNewChatModal">
            <i class="fas fa-user-plus"></i>
            <span>Nouvelle discussion</span>
          </button>
          <button class="action-btn" id="quickNewGroup" @click="showNewGroupModal">
            <i class="fas fa-users"></i>
            <span>Créer un groupe</span>
          </button>
        </div>

        <div class="search-box">
          <div class="input-with-icon">
            <i class="fas fa-search"></i>
            <input type="text" id="searchConversations"
                   v-model="searchConv"
                   placeholder="Rechercher une conversation...">
          </div>
        </div>

        <div class="conversations-list" id="conversationsList">
          <div class="empty-state" v-if="chat.conversations?.length === 0">
            <i class="fas fa-comments"></i>
            <p>Aucune conversation</p>
            <small>Commencez une nouvelle discussion</small>
          </div>

          <div class="conversation-item" v-for="(conv, index) in chat.conversations" :key="index"
               :data-id="conv.id" @click="setActiveConv(conv)">
            <div class="conversation-avatar">{{ getInitialAllNames(getConvName(conv)) }}</div>
            <div class="conversation-details">
              <h4>
                <i class="fas fa-users" v-if="conv.name"
                   style="margin-right: 5px; font-size: 12px;"></i>
                {{ getConvName(conv) }}
              </h4>
              <p>{{ truncateWords(conv.Messages[0]?.contenu || "") }}</p>
            </div>
            <div class="conversation-meta">
              <div class="conversation-time">
                {{ formatDateLabel(conv.Messages[0]?.createdAt || conv.createdAt) }}
              </div>
              <div class="unread-count" v-if="conv.unread > 0">{{ conv.unread }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone de conversation active -->
      <div class="chat-area">
        <div class="chat-header" id="chatHeader">
          <div class="no-conversation" v-if="!chat.activeConv">
            <i class="fas fa-comments"></i>
            <h3>Sélectionnez une conversation</h3>
            <p>Choisissez une conversation dans la liste ou commencez une nouvelle discussion</p>
            <div class="action-buttons">
              <button class="btn btn-primary" id="startNewChatFromEmpty" @click="showNewChatModal">
                <i class="fas fa-user-plus"></i>
                Nouvelle discussion
              </button>
              <button class="btn btn-secondary" id="createGroupFromEmpty"
                      @click="showNewGroupModal">
                <i class="fas fa-users"></i>
                Créer un groupe
              </button>
            </div>
          </div>
<!--          <div class="user-info" v-if="chat.activeConv">-->
<!--            <div class="conversation-avatar">{{-->
<!--                getInitialAllNames(getConvName(chat.activeConv))-->
<!--              }}-->
<!--            </div>-->
<!--            <div class="user-details">-->
<!--              <h3>{{ getConvName(chat.activeConv) }}</h3>-->
<!--              <p v-if="chat.activeConv.name">{{ chat.activeConv.MembreConversations.length }}-->
<!--                membre(s)</p>-->
<!--              <p v-else>-->
<!--                {{-->
<!--                  socket.usersConnected.includes(-->
<!--                    getOtherMembreInPrivate(chat.activeConv).User.username-->
<!--                  ) ? 'En ligne' : 'Hors Ligne'-->
<!--                }}-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->

          <div class="user-info" v-else>
            <div class="conversation-avatar">{{
                getInitialAllNames(getConvName(chat.activeConv))
              }}
            </div>
            <div class="user-details">
              <div class="header-top">
                <h3>{{ getConvName(chat.activeConv) }}</h3>
                <button
                  v-if="chat.activeConv.name"
                  class="icon-btn small"
                  @click="showGroupDetails(chat.activeConv)"
                  title="Détails du groupe"
                >
                  <i class="fas fa-ellipsis-v"></i>
                </button>
              </div>
              <p>
          <span v-if="chat.activeConv.name">
            {{ chat.activeConv.MembreConversations?.length || 0 }} membre(s)
          </span>
                <span v-else>
            <i
              class="fas fa-circle"
              :class="socket.usersConnected.includes(
                      getOtherMembreInPrivate(chat.activeConv).User.username
                    ) ? 'online' : 'offline'"
            ></i>
            {{
                    socket.usersConnected.includes(
                      getOtherMembreInPrivate(chat.activeConv).User.username
                    ) ? 'En ligne' : 'Hors Ligne'
                  }}
          </span>
              </p>
            </div>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages">
          <!-- Les messages seront générées dynamiquement -->
          <div v-for="(msg, index) in chat.activeConv?.Messages" :key="index"
               class="message"
               :class="{'system': msg.type === 'EVENT', 'sent': msg.senderId === user.user.id, 'received': (msg.senderId !== null && msg.senderId !== user.user.id)}"
               :data-id="msg.id ? msg.id : '0'">
            <div class="message-bubble">
              <strong
                v-if="msg.senderId !== null && msg.senderId !== user.user.id && msg.sender">
                {{ msg.sender.prenoms + ' ' + msg.sender.nom }}<br>
              </strong>
              {{ msg.contenu }}
              <div class="message-time">{{ formatDateLabel(msg.date_envoi) }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input-area" id="chatInputArea" v-if="chat.activeConv">
          <div class="input-with-icon">
            <i class="fas fa-paperclip" style="box-sizing: content-box !important;"></i>
            <input type="text" v-model="message" id="messageInput"
                   style="box-sizing: content-box !important;"
                   placeholder="Tapez votre message...">
            <button class="send-btn" :disabled="!message" @click="sendMessage()"
                    style="box-sizing: content-box !important;" id="sendMessage">
              <i class="fas fa-paper-plane"
                 style="color: white; box-sizing: content-box !important;"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div class="modal" id="newChatModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nouvelle discussion</h3>
          <button class="close-btn" id="closeNewChatModal" @click="closeNewChatModal">&times;
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="contactSearch">Rechercher un contact</label>
            <div class="input-with-icon">
              <i class="fas fa-search"></i>
              <input type="text" v-model="searchContactNewChat" id="contactSearch"
                     placeholder="Nom du contact...">
            </div>
          </div>
          <div class="contacts-list" id="contactsList">
            <div class="contact-item" :class="selectedUser.id === u.id ? 'selected': ''"
                 v-for="(u, index) in chat.users" :key="index" :data-id="u.id"
                 @click="selectContact(u)">
              <div class="contact-avatar">{{ getInitialAllNames(u.nom + " " + u.prenoms) }}</div>
              <div class="contact-info">
                <h4>{{ u.nom + " " + u.prenoms }}</h4>
                <p>{{ u.username }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelNewChat" @click="closeNewChatModal">Annuler
          </button>
          <button class="btn btn-primary" id="startChat" @click="newChatConv()"
                  :disabled="(Object.keys(selectedUser).length === 0) || chat.isLoadingNewConv">
            <div class="spinner-border text-light" v-if="chat.isLoadingNewConv" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span v-else>Commencer la discussion</span>
          </button>
        </div>
      </div>
    </div>

    <div class="modal" id="newGroupModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Créer un nouveau groupe</h3>
          <button class="close-btn" id="closeNewGroupModal" @click="closeNewGroupModal">&times;
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="groupName">Nom du groupe</label>
            <input type="text" id="groupName" v-model="groupName"
                   placeholder="Entrez le nom du groupe...">
          </div>
          <div class="form-group">
            <label for="groupSearch">Ajouter des membres</label>
            <div class="input-with-icon">
              <i class="fas fa-search"></i>
              <input type="text" id="groupSearch" v-model="searchContactGroup"
                     placeholder="Rechercher des contacts...">
            </div>
          </div>
          <div class="selected-contacts" id="selectedContacts">
            <!-- Contacts sélectionnés -->
            <div class="selected-contact" v-for="(u, index) in selectedUsers" :key="index">
              <span>{{ u.nom + " " + u.prenoms }}</span>
              <button class="remove-contact" :data-id="u.id" @click="removeFromContactGroup(u)">
                &times;
              </button>
            </div>
          </div>
          <div class="contacts-list" id="groupContactsList">
            <!-- Liste des contacts pour le groupe -->
            <div class="contact-item" :class="isSelectedForGroup(u) ? 'selected': ''"
                 v-for="(u, index) in chat.users" :key="index" :data-id="u.id"
                 @click="toggleGroupMember(u)">
              <div class="contact-avatar">{{ getInitialAllNames(u.nom + " " + u.prenoms) }}</div>
              <div class="contact-info">
                <h4>{{ u.nom + " " + u.prenoms }}</h4>
                <p>{{ u.username }}</p>
              </div>
              <div class="contact-checkbox">{{ isSelectedForGroup(u) ? '✓' : '' }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelNewGroup" @click="closeNewGroupModal()">
            Annuler
          </button>
          <button class="btn btn-primary" id="createGroup"
                  :disabled="(selectedUsers.length === 0 || !groupName.trim()) || chat.isLoadingNewGroup"
                  @click="newGroup()">
            <div class="spinner-border text-light" v-if="chat.isLoadingNewGroup" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span v-else>Créer le groupe</span>
          </button>
        </div>
      </div>
    </div>

    <GroupDetailsModal
      :is-visible="showGroupDetail"
      :group="selectedGroup"
      :all-users="chat.users"
      @close="closeGroupDetails"
      @update-name="updateGroupName"
      @add-member="addGroupMember"
      @mute-member="muteGroupMember"
      @ban-member="banGroupMember"
      @grantMember="grantMember"
      @leave-group="leaveGroup"
    />

  </div>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import {useUserStore} from "@/stores/userStore.js";
import {useSocketStore} from "@/stores/socket.js";
import $ from 'jquery';
import {useChatStore} from "@/stores/chat.js";
import {formatDateLabel, getInitialAllNames, truncateWords} from "@/utils/services.js";
import GroupDetailsModal from "@/components/GroupDetailsModal.vue";

const user = ref(useUserStore())

const chat = useChatStore()

const socket = ref(useSocketStore())

const message = ref("")

const searchConv = ref("")

const showGroupDetail = ref(false);

const selectedGroup = ref(null);

const showGroupDetails = (group) => {
  selectedGroup.value = group;
  showGroupDetail.value = true;
};

const closeGroupDetails = () => {
  showGroupDetail.value = false;
  selectedGroup.value = null;
};

// Méthodes pour groupes (à implémenter)
const updateGroupName = async (data) => {
  console.log('Update group name:', data);
  await chat.changeGroupName(chat.activeConv, data.newName)
};

const addGroupMember = async (data) => {
  console.log('Add group member:', data);
  await chat.addMember(data.group, data.user)
};

const muteGroupMember = async (data) => {
  console.log('Mute group member:', data);
  await chat.toggleMute(data.group, data.user);
};

const banGroupMember = async (data) => {
  console.log('Ban group member:', data);
  await chat.ban(data.group, data.user);
};

const grantMember = async (data) => {
  console.log('Grant group member:', data);
  await chat.grant(data.group, data.user);
};

const leaveGroup = async (data) => {
  console.log('leave group member:', data);
  await chat.leave(data.group, data.user);
};

const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const msgId = entry.target.dataset.id;
      const msg = chat.activeConv.Messages.find(m => m.id == msgId);
      const index = chat.activeConv.Messages.findIndex(m => m.id == msgId);
      if (msg && !isMessageRead(msg)) {
        chat.activeConv.Messages[index].readBy.push(user.value.user.id)
        await chat.markMessageAsRead(msg.id, chat.activeConv.id);
      }
    }
  }
});

const selectedUser = ref({})
const selectedUsers = ref([])
const groupName = ref("")
const searchContactGroup = ref("")
const searchContactNewChat = ref("")

function isSelectedForGroup(u) {
  return selectedUsers.value.some(member => member.id === u.id);
}

function toggleGroupMember(u) {
  const existingIndex = selectedUsers.value.findIndex(member => member.id === u.id);

  if (existingIndex > -1) {
    selectedUsers.value.splice(existingIndex, 1);
  } else {
    selectedUsers.value.push(u);
  }

}

function removeFromContactGroup(u) {
  selectedUsers.value = selectedUsers.value.filter(member => member.id !== u.id)
}

function getInitial() {
  return user.value.user.nom[0] + user.value.user.prenoms[0]
}

function getOtherMembreInPrivate(conv) {
  const membres = conv.MembreConversations;
  return membres.find(mc => mc.User.id !== user.value.user.id);
}

// function getDetailUserInconv(conv) {
//   const membres = conv.MembreConversations;
//   return membres.find(mc => mc.user.id === user.value.user.id);
// }

function showNewChatModal() {
  $('#newChatModal').addClass("active");
}

async function newChatConv() {
  const existConv = chat.conversations.find(conv => {
    if (conv.name) {
      return false;
    }
    const other = getOtherMembreInPrivate(conv)
    return other.userId === selectedUser.value.id;
  })
  if (existConv) {
    chat.activeConv = existConv;
  } else {
    await chat.newConv(selectedUser.value.id);
    chat.conversations.unshift(chat.activeConv);
  }
  closeNewChatModal();
}

async function newGroup() {
  const contacts = selectedUsers.value.map(u => u.id);
  await chat.newGroup(groupName.value, contacts);
  chat.conversations.unshift(chat.activeConv);
  closeNewGroupModal();
}

function setActiveConv(conv) {

  $('.conversation-item').each(function () {
    $(this).removeClass('active');
  });

  const selectedItem = $(`.conversation-item[data-id="${conv.id}"]`);
  if (selectedItem) {
    selectedItem.addClass('active');
  }
  chat.activeConv = conv;
  readMessage()
  if (conv.unread > 0) {
    for (let i = 0; i < conv.unread; i++) {
      chat.markMessageAsRead(conv.Messages[i].id, conv.id);
      const tab = JSON.parse(conv.Messages[i].readBy || "[]") || [];
      tab.push(user.value.user.id);
      conv.Messages[i].readBy = JSON.stringify(tab);
    }
  }
  $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
}

function closeNewChatModal() {
  $('#newChatModal').removeClass("active");
  selectedUser.value = {}
  searchContactNewChat.value = ""
}

function showNewGroupModal() {
  $('#newGroupModal').addClass("active");
}

function closeNewGroupModal() {
  $('#newGroupModal').removeClass("active");
  selectedUsers.value = []
  groupName.value = ""
  searchContactGroup.value = ""
}

function getConvName(conv) {
  if (conv) {
    if (conv.name) {
      return conv.name
    } else {
      const mcv = getOtherMembreInPrivate(conv)
      return mcv.User.nom + " " + mcv.User.prenoms;
    }
  }
  return "";
}

function selectContact(contact) {
  selectedUser.value = contact
}

function filterGroupContacts(val) {
  const searchQuery = val.toLowerCase();

  $('#groupContactsList .contact-item').each(function () {
    const name = $(this).find('h4').text().toLowerCase();

    if (name.includes(searchQuery)) {
      $(this).css('display', 'flex');
    } else {
      $(this).css('display', 'none');
    }
  });
}

function filterContacts(val) {
  const searchQuery = val.toLowerCase();

  $('#contactsList .contact-item').each(function () {
    const name = $(this).find('h4').text().toLowerCase();

    if (name.includes(searchQuery)) {
      $(this).css('display', 'flex');
    } else {
      $(this).css('display', 'none');
    }
  });
}

function filterConversations(val) {
  const searchQuery = val.toLowerCase();
  const conversationItems = document.querySelectorAll('.conversation-item');

  conversationItems.forEach(item => {
    const name = item.querySelector('h4').textContent.toLowerCase();
    if (name.includes(searchQuery)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

watch(searchContactGroup, (value) => {
  filterGroupContacts(value)
})

watch(searchConv, (value) => {
  filterConversations(value)
})

watch(searchContactNewChat, (value) => {
  filterContacts(value)
})

watch(chat.activeConv, () => {
  readMessage()
  $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
})

async function sendMessage() {
  await chat.sendMessage(chat.activeConv, message.value)
  message.value = ""
  $("#chatMessages").animate({scrollTop: $("#chatMessages")[0].scrollHeight}, 500);
}

const isMessageRead = (msg) => {
  return (msg.readBy || []).includes(user.value.user.id) || msg.senderId === user.value.user.id;
};

function readMessage() {
// Observer tous les éléments avec la classe
  $('.received').each(function () {
    observer.observe(this);  // 'this' est l'élément DOM natif
  });
}

onMounted(async () => {
  if (!socket.value.socket) await socket.value.connect(user.value.token)
  socket.value.setupEventHandlers();
  $(document).on('click', function (e) {
    if (e.target.id === "newChatModal") {
      console.log("clicked")
      closeNewChatModal();
    }

    if (e.target.id === "newGroupModal") {
      closeNewGroupModal();
    }
  })
  await chat.fetchConversations();
  await chat.fetchUsers();

  readMessage();
})


</script>


<style scoped>
@import './Home.style.css';
</style>
