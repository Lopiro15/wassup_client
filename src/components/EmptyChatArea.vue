<template>
  <div class="empty-chat-area">
    <i class="fas fa-comments"></i>
    <h3>Sélectionnez une conversation</h3>
    <p>Choisissez une conversation dans la liste ou commencez une nouvelle discussion</p>
    <div class="empty-actions">
      <button class="btn btn-primary" @click="$emit('new-chat')">
        <i class="fas fa-user-plus"></i>
        Nouvelle discussion
      </button>
      <button class="btn btn-secondary" @click="$emit('new-group')">
        <i class="fas fa-users"></i>
        Créer un groupe
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['new-chat', 'new-group']);
</script>

<style scoped>
.empty-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #777;
  padding: 40px 20px;
}

.empty-chat-area i {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ccc;
}

.empty-chat-area h3 {
  margin-bottom: 10px;
  color: #555;
  font-size: 18px;
}

.empty-chat-area p {
  margin-bottom: 30px;
  max-width: 400px;
  line-height: 1.5;
  font-size: 14px;
}

.empty-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 768px) {
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }

  .empty-actions .btn {
    width: 200px;
    justify-content: center;
  }
}
</style>
