<script>
import {useUserStore} from "@/stores/userStore.js";
import {useRouter} from "vue-router";
import {useSocketStore} from "@/stores/socket.js";

export default {
  name: "LoginView",
  data() {
    return {
      user: useUserStore(),
      socketStore: useSocketStore(),
      router: useRouter(),
      form: {
        username: "",
        password: ""
      }
    }
  },
  methods: {
    async login() {
      const res = await this.user.login(this.form.username, this.form.password);
      if (res) {
        await this.router.push("/");
      }
      // if (res) {
      //   try {
      //     const rep = await this.socketStore.connect(this.user.token);
      //     if (rep.status) {
      //       await this.router.push("/");
      //     }
      //   } catch (e) {
      //     console.log("Erreur ecdh:" + e.error)
      //   }
      //
      // }
    }
  }
}
</script>

<template>
  <div class="body">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Connexion</h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        <form class="auth-form" id="loginForm" @submit.prevent="login">
          <div class="alert alert-danger text-center" v-if="user.errorLogin">{{this.user.errorLogin}}</div>
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <div class="input-with-icon">
              <i class="fas fa-user"></i>
              <input type="text" id="username" v-model="form.username" name="username" required>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-with-icon">
              <i class="fas fa-lock"></i>
              <input type="password" id="password" v-model="form.password" name="password" required>
            </div>
          </div>

          <button type="button" class="btn btn-primary" v-if="user.isLoadingLogin" disabled>
            <div class="spinner-border text-light"  role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </button>
          <button type="submit" class="btn btn-primary" v-else>
            <i class="fas fa-sign-in-alt"></i>
            Se connecter
          </button>
        </form>

        <div class="auth-footer">
          <p>Pas encore de compte ? <router-link to="register">S'inscrire</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h1 {
  color: #764ba2;
  font-size: 28px;
  margin-bottom: 10px;
}

.auth-header p {
  color: #777;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.input-with-icon {
  position: relative;
}

.input-with-icon i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.input-with-icon input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

.input-with-icon input:focus {
  border-color: #764ba2;
  box-shadow: 0 0 0 2px rgba(118, 75, 162, 0.2);
  outline: none;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  gap: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #777;
}

.auth-footer a {
  color: #764ba2;
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
  }

  .auth-header h1 {
    font-size: 24px;
  }
}
</style>
