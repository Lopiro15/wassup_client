<template>
  <div class="body">

    <ChatContainer
      @show-new-chat-modal="showNewChatModal"
      @show-new-group-modal="showNewGroupModal"
      @show-group-details="showGroupDetails"
    />

    <NewChatModal
      :is-visible="showNewChat"
      :users="chat.users"
      :is-loading="chat.isLoadingNewConv"
      @close="closeNewChatModal"
      @start-chat="newChatConv"
    />

    <NewGroupModal
      :is-visible="showNewGroup"
      :is-loading="chat.isLoadingNewGroup"
      :users="chat.users"
      @close="closeNewGroupModal"
      @create-group="newGroup"
    />

    <GroupDetailsModal
      :is-visible="showGroupDetail"
      :group="chat.activeConv"
      :all-users="chat.users"
      :isbanned="isBanned"
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
import {computed, onMounted, ref} from 'vue'
import {useUserStore} from "@/stores/userStore.js";
import {useSocketStore} from "@/stores/socket.js";
import $ from 'jquery';
import {useChatStore} from "@/stores/chat.js";
import GroupDetailsModal from "@/components/GroupDetailsModal.vue";
import ChatContainer from "@/components/ChatContainer.vue";
import NewChatModal from "@/components/NewChatModal.vue";
import NewGroupModal from "@/components/NewGroupModal.vue";

const user = ref(useUserStore())

const chat = useChatStore()

const socket = ref(useSocketStore())

const showGroupDetail = ref(false);
const showNewChat = ref(false);
const showNewGroup = ref(false);

const selectedGroup = ref(null);

const isBanned = computed(() => {
  if (chat.activeConv && chat.activeConv.name) {
    return chat.activeConv.MembreConversations.some((mb) => mb.statut === "BANNED" && mb.User.id === user.value.user.id);
  } else {
    return false;
  }
})

const showGroupDetails = () => {
  selectedGroup.value = chat.activeConv;
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

const selectedUser = ref({})

function getOtherMembreInPrivate(conv) {
  const membres = conv.MembreConversations;
  return membres.find(mc => mc.User.id !== user.value.user.id);
}

function showNewChatModal() {
  showNewChat.value = true;
}

async function newChatConv(data) {
  const existConv = chat.conversations.find(conv => {
    if (conv.name) {
      return false;
    }
    const other = getOtherMembreInPrivate(conv)
    return other.userId === data;
  })
  if (existConv) {
    chat.activeConv = existConv;
  } else {
    await chat.newConv(data);
    chat.conversations.unshift(chat.activeConv);
  }
  closeNewChatModal();
}

async function newGroup(data) {
  await chat.newGroup(data.name, data.members);
  chat.conversations.unshift(chat.activeConv);
  closeNewGroupModal();
}


function closeNewChatModal() {
  // $('#newChatModal').removeClass("active");
  // selectedUser.value = {}
  // searchContactNewChat.value = ""
  showNewChat.value = false
}

function showNewGroupModal() {
  // $('#newGroupModal').addClass("active");
  showNewGroup.value = true
}

function closeNewGroupModal() {
  // $('#newGroupModal').removeClass("active");
  // selectedUsers.value = []
  // groupName.value = ""
  // searchContactGroup.value = ""
  showNewGroup.value = false
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
})


</script>


<style scoped>
@import './Home.style.css';
</style>
