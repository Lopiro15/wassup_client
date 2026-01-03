<script setup>
import {ref} from "vue";
import {useUserStore} from "@/stores/userStore.js";
import {useRouter} from "vue-router";

const user = useUserStore()
const router = useRouter()

const isValid = ref("form-control")
const errorSamePass = ref("")

const form = ref({
  username: "",
  nom: "",
  prenoms: "",
  telephone: "",
  password: "",
  confirmPass: ""
})

async function register() {
  if (form.value.confirmPass !== form.value.password) {
    isValid.value = "form-control is-invalid"
    errorSamePass.value = "Les mots de passes ne correspondent pas."
    return;
  }
  const res = await user.registration(
    form.value.username,
    form.value.nom,
    form.value.prenoms,
    form.value.telephone,
    form.value.password
  )
  if (res) {
    isValid.value = "form-control"
    errorSamePass.value = null
    await router.push("/")
  }
}

</script>

<template>
  <div class="body">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Inscription</h1>
          <p>Créez votre compte</p>
        </div>

        <form class="auth-form" id="registerForm" @submit.prevent="register">
          <div class="alert alert-danger text-center" v-if="user.errorRegistration">{{user.errorRegistration}}</div>
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <div class="input-with-icon">
              <i class="fas fa-user"></i>
              <input type="text" id="username" v-model="form.username" name="username" required>
            </div>
          </div>

          <div class="form-group">
            <label for="firstName">Prénom</label>
            <div class="input-with-icon">
              <i class="fas fa-user-circle"></i>
              <input type="text" id="firstName" v-model="form.prenoms" name="firstName" required>
            </div>
          </div>

          <div class="form-group">
            <label for="lastName">Nom</label>
            <div class="input-with-icon">
              <i class="fas fa-user-circle"></i>
              <input type="text" id="lastName" v-model="form.nom" name="lastName" required>
            </div>
          </div>

          <div class="form-group">
            <label for="phone">Téléphone</label>
            <div class="input-with-icon">
              <i class="fas fa-phone"></i>
              <input type="tel" id="phone" v-model="form.telephone" name="phone" required>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-with-icon">
              <i class="fas fa-lock"></i>
              <input type="password" id="password" v-model="form.password" name="password" required>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <div class="input-with-icon">
              <i class="fas fa-lock"></i>
              <input type="password" id="confirmPassword" v-model="form.confirmPass"
                     :class="isValid" name="confirmPassword"
                     aria-describedby="validationConfirmPass" required>
              <div id="validationConfirmPass" class="invalid-feedback">
                {{ errorSamePass }}
              </div>
            </div>

          </div>

          <button type="button" class="btn btn-primary" v-if="user.isLoadingRegistration" disabled>
            <div class="spinner-border text-light" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </button>

          <button type="submit" class="btn btn-primary" v-else>
            <i class="fas fa-user-plus"></i>
            S'inscrire
          </button>
        </form>

        <div class="auth-footer">
          <p>Déjà un compte ?
            <router-link to="login">Se connecter</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.body {
  margin: 0;
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
