<template>
  <div class="chat-avatar" :class="{ 'group': isGroup }" :style="avatarStyle">
    {{ initials }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
});

const initials = computed(() => {
  const parts = props.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : '?';
});

const avatarStyle = computed(() => {
  const sizes = {
    sm: { width: '30px', height: '30px', fontSize: '12px' },
    md: { width: '45px', height: '45px', fontSize: '16px' },
    lg: { width: '50px', height: '50px', fontSize: '18px' }
  };
  return sizes[props.size];
});
</script>

<style scoped>
.chat-avatar {
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.chat-avatar.group {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
}
</style>
