<template>
  <div class="messages-container" ref="container" @scroll="handleScroll">
    <div
      v-for="(msg, index) in messages"
      :key="msg.id || index"
      class="message"
      :class="getMessageClass(msg)"
      :data-id="msg.id"
      ref="messageEls"
    >
      <div class="message-bubble">
        <strong v-if="showSenderName(msg)">
          {{ getSenderName(msg) }}
        </strong>
        <span v-if="showSenderName(msg)"><br></span>
        <span class="message-content">{{ msg.contenuDecrypte || msg.contenu }}</span>
        <div class="message-time">
          {{ formatTime(msg.date_envoi || msg.createdAt) }}
          <span v-if="msg.senderId === currentUserId" class="message-status">
            {{ getMessageStatus(msg) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUpdated, nextTick } from 'vue';
import { formatDateLabel } from '@/utils/services.js';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: Number,
    required: true
  },
  conversationId: { // AJOUTER CETTE PROP
    type: Number,
    default: null
  }
});

const emit = defineEmits(['message-read']);

const container = ref(null);
const messageEls = ref([]);
const observer = ref(null);

const getMessageClass = (msg) => {
  if (msg.type === 'EVENT') return 'system';
  if (msg.senderId === props.currentUserId) return 'sent';
  return 'received';
};

const showSenderName = (msg) => {
  return msg.senderId !== props.currentUserId &&
    msg.senderId !== null &&
    msg.sender;
};

const getSenderName = (msg) => {
  if (!msg.sender) return '';
  return `${msg.sender.prenoms} ${msg.sender.nom}`;
};

const formatTime = (dateString) => {
  return formatDateLabel(dateString);
};

const getMessageStatus = (msg) => {
  if (!msg.readBy || msg.readBy.length <= 1) return '✓';
  return '✓✓';
};

const handleScroll = () => {
  // Vous pouvez ajouter du lazy loading ici si nécessaire
};

// Observer pour détecter quand les messages deviennent visibles
onMounted(() => {
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const msgId = entry.target.dataset.id;
        const msg = props.messages.find(m => m.id == msgId);
        if (msg && msg.senderId !== props.currentUserId) {
          emit('message-read', {
            messageId: msg.id,
            conversationId: props.conversationId || msg.conversationId
          });
        }
      }
    });
  }, { threshold: 0.5 });

  // Observer tous les messages après le rendu
  nextTick(() => {
    messageEls.value.forEach(el => {
      if (el) observer.value.observe(el);
    });
  });
});

onUpdated(() => {
  // Ré-observer les nouveaux messages
  nextTick(() => {
    messageEls.value.forEach(el => {
      if (el && !observer.value.takeRecords().some(entry => entry.target === el)) {
        observer.value.observe(el);
      }
    });
  });
});

// Scroll automatique vers le bas pour les nouveaux messages
onUpdated(() => {
  nextTick(() => {
    if (container.value) {
      container.value.scrollTop = container.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column-reverse; /* MODIFIÉ */
  justify-content: flex-end; /* AJOUT */
}

.message {
  margin-bottom: 15px;
  display: flex;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.received {
  justify-content: flex-start;
}

.message.sent {
  justify-content: flex-end;
}

.message.system {
  justify-content: center;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
  word-wrap: break-word;
}

.received .message-bubble {
  background: white;
  border-top-left-radius: 4px;
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.sent .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-top-right-radius: 4px;
  color: white;
}

.message.system .message-bubble {
  background: #f8f9fa;
  color: #666;
  font-style: italic;
  border-radius: 12px;
  max-width: 80%;
  text-align: center;
}

.message-content {
  display: block;
  margin-bottom: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  text-align: right;
}

.sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-status {
  margin-left: 4px;
  font-size: 10px;
}

.message:first-child {
  margin-bottom: 0;
  margin-top: 15px;
}
</style>
