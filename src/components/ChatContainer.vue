<script setup>
import Sidebar from "@/components/Sidebar.vue";
import ChatArea from "@/components/ChatArea.vue";

const emit = defineEmits([
  'show-new-group-modal',
  'show-new-chat-modal',
  'show-group-details'
]);

function showGroupDetails() {
  emit("show-group-details");
}

function showNewGroupModal() {
  emit("show-new-group-modal");
}

function showNewChatModal() {
  emit("show-new-chat-modal")
}
</script>

<template>
  <div class="chat-container">
    <!-- Sidebar des conversations -->
    <Sidebar
      @show-new-chat-modal="showNewChatModal"
      @show-new-group-modal="showNewGroupModal"
    />

    <!-- Zone de conversation active -->
    <ChatArea
      @show-new-group-modal="showNewGroupModal"
      @show-new-chat-modal="showNewChatModal"
      @show-group-details="showGroupDetails"
    />
  </div>
</template>

<style scoped>
@import './../views/Home/Home.style.css';

</style>
