<template>
  <div class="message-input-area">
    <div class="message-input-wrapper">
      <i class="fas fa-paperclip" @click="$emit('attach')"></i>
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="sendMessage"
        placeholder="Tapez votre message..."
        :disabled="disabled"
      />
      <button
        class="send-btn"
        @click="sendMessage"
        :disabled="!canSend || disabled"
        :title="canSend ? 'Envoyer' : 'Message vide'"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'send', 'attach']);

const canSend = computed(() => {
  return props.modelValue.trim().length > 0;
});

const sendMessage = () => {
  if (canSend.value && !props.disabled) {
    emit('send', props.modelValue.trim());
    emit('update:modelValue', '');
  }
};
</script>

<style scoped>
.message-input-area {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.message-input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 5px 15px;
  gap: 10px;
}

.message-input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 5px;
  font-size: 14px;
  outline: none;
  min-width: 0;
}

.message-input-wrapper input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-input-wrapper i {
  color: #777;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;
}

.message-input-wrapper i:hover:not(:disabled) {
  color: #764ba2;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #ccc;
}
</style>
