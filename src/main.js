import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import "bootstrap/dist/css/bootstrap.min.css"

import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import "bootstrap"
import "select2/dist/css/select2.min.css"
import "select2-bootstrap-5-theme/dist/select2-bootstrap-5-theme.min.css"

import "select2/dist/js/select2.min.js"
import "select2"
import "@fortawesome/fontawesome-free/css/all.min.css"

import "jquery"


import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)


app.use(pinia)
app.use(router)

app.component('v-select', vSelect)

app.use(Toast, {
  position: "top-right"
})

app.mount('#app')
