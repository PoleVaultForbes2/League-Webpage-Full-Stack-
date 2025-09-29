<!-- components/LoginForm.vue -->
<script setup>
import { ref } from 'vue'

const isSignup = ref(false)
const username = ref('')
const password = ref('')
const tag_line = ref("")

const emit = defineEmits(['login', 'signup'])

function toggleMode(){
  isSignup.value = !isSignup.value
}

function handleLogin() {
  if (username.value.trim() && password.value.trim()) {
    emit('login', { username: username.value.trim(), password: password.value.trim() })
    // Clear form after submission
    username.value = ''
    password.value = ''
    tag_line.value = ''
  }
}

function handleSignup() {
  if (username.value.trim() && password.value.trim()) {
    emit('signup', { username: username.value.trim(), password: password.value.trim(), tag_line: tag_line.value.trim() || "NA1" })
    // Clear form after submission
    username.value = ''
    password.value = ''
    tag_line.value = ''
  }
}
</script>

<template>
  <div class="bg-gray-100 p-8 rounded-xl shadow-2xl w-96 max-w-md mx-4">
    <h2 class="text-2xl font-bold mb-6 text-center text-green-500">
      {{ isSignup ? 'Sign Up' : 'Summoner Login' }}
    </h2>

    <input
      v-model="username"
      type="text"
      placeholder="Riot ID"
      class="w-full mb-4 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      class="w-full mb-4 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />

    <input
      v-if="isSignup"
      v-model="tag_line"
      type="text"
      placeholder="Tag Line (default: NA1)"
      class="w-full mb-6 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />

    <div class="flex flex-col gap-3">
      <button
        v-if="!isSignup"
        @click="handleLogin"
        class="w-full bg-[#34A798] text-white px-4 py-3 rounded-md hover:bg-[#007475] transition-colors duration-200 font-semibold"
        type="button"
      >
        Login
      </button>

      <button
        v-if="isSignup"
        @click="handleSignup"
        class="w-full bg-[#34A798] text-white px-4 py-3 rounded-md hover:bg-[#007475] transition-colors duration-200 font-semibold"
        type="button"
      >
        Sign Up
      </button>

      <button
        @click="toggleMode"
        class="text-blue-600 hover:text-blue-800 underline text-center py-2 transition-colors duration-200"
        type="button"
      >
        {{ isSignup ? 'Already have an account? Login' : 'Need an account? Sign up' }}
      </button>
    </div>
  </div>
</template>
