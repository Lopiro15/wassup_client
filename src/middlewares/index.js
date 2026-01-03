import {useUserStore} from "@/stores/userStore.js";

export function auth(to, from, next) {
  const store  = useUserStore()
  if (store.token === null) {
    return next('/login')
  } else {
    next()
  }
}
