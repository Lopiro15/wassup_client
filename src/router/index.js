import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/Home/HomeView.vue'
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import {auth} from "@/middlewares/index.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { middleware: [auth] }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
  ],
})

// Application des middlewares
router.beforeEach((to, from, next) => {
  const middlewares = to.meta.middleware || []

  if (!middlewares.length) {
    return next()
  }

  runMiddlewares(to, from, next, middlewares)
})

function runMiddlewares(to, from, next, middlewares, index = 0) {
  if (index >= middlewares.length) {
    return next()
  }

  const middleware = middlewares[index]

  middleware(to, from, (path) => {
    // Si redirection, arrêter immédiatement
    if (path) {
      return next(path)
    }
    // Sinon passer au middleware suivant
    runMiddlewares(to, from, next, middlewares, index + 1)
  })
}

export default router
