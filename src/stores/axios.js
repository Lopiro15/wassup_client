import {defineStore} from "pinia";
import {ref} from "vue";
import axios from "axios";

export const useAxiosStore = defineStore('axios', () => {
  const api = ref(axios.create({
    baseURL: "http://localhost:3000/api",
    timeout: 5000
  }))

  return { api }
})
