<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import logo from '@/assets/images/cs_logo.png'

const props = defineProps({
  currentUser: Object,
})

const emit = defineEmits(['open-login', 'logout', 'menuAction']);

const menuOpen = ref(false);
let hoverTimeout = null;

// *********************
// For Group Leaderboard stuff
const showGroupLeaderboard = ref(false);
const groupError = ref("");
const inputClass = ref("");
const groupName = ref("");

// Clear error from input box
function clearError() {
  if (groupName.value.trim()) {
    groupError.value = "";
    inputClass.value = "";
  }
}

// emit action from drop down menu
function emitAction(action){
  menuOpen.value = false;

  if(!groupName.value.trim()){
    groupError.value = "Must give group name";
    inputClass.value = "border-red-500";
    return
  }

  if(action === "view"){
    showGroupLeaderboard.value = !showGroupLeaderboard.value;
  }
  // tells whether add/view was clicked
  emit("menuAction", action, groupName.value);
}

// for the viewing of groups dropdown
function showMenu(){
  if(hoverTimeout){
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  menuOpen.value = true;
}

function hideMenu(){
  hoverTimeout = setTimeout(() => {
    menuOpen.value = false;
  }, 600);
}

// Compute property of the leaderboard button text
const leaderboardButtonText = computed(() => {
  return showGroupLeaderboard.value ? 'Hide Leaderboard' : 'View Group Leaderboard';
});

// **************************


// *** If logged in change the welcome message ***
const greetingMessage = computed(() => {
  return props.currentUser
    ? `Welcome ${props.currentUser.username}`
    : 'Welcome Summoner';
});

// *** If logged in change the background class ***
const bodyClass = computed(() => {
  return props.currentUser
  ? 'logged-in'
  : 'logged-out'
})

// *** Updates the body class ***
function updateBodyClass(){
  document.body.classList.remove('logged-in', 'logged-out')
  document.body.classList.add(bodyClass.value)
}

// *** Watch for currenUser change ***
watch(() => props.currentUser, () => {
  updateBodyClass()
})

// *** Handles login and logout clicked ***
function handleLoginClick(){
  emit('open-login')
}

function handleLogoutClick(){
  // When logged out, switch values back to original
  showGroupLeaderboard.value = false;
  groupError.value = "";
  inputClass.value = "";
  groupName.value = "";

  emit('logout')
}

// *** Track if user has scrolled past navbar image ***
const scrolled = ref(false)

function handleScroll(){
  scrolled.value = window.scrollY > 350
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <!-- Input for Group Name -->
  <div class="p-6 absolute top-0 right-32 w-80 z-50" v-if="currentUser">
      <div class="max-w-md mx-auto absolute">
        <input
          v-model="groupName"
          type="text"
          placeholder="Enter group name"
          :class="[
            'w-full',
            'p-3',
            'border',
            'rounded-lg',
            'bg-gray-800',
            'text-white',
            'placeholder-gray-400',
            'focus:outline-none',
            'focus:border-teal-400',
            inputClass,
          ]"
          @input="clearError"
        />
        <p v-if="groupError" class="text-red-600 text-sm">{{ groupError }}</p>
      </div>
    </div>
  <!-- Rest of NavBar -->
  <div>
    <nav class="fixed w-full top-0 left-0 transition-colors duration-300 z-10" :class="scrolled ? 'bg-gray-900 bg-opacity-50' : 'bg-transparent'">
      <div class="max-w-full flex items-center justify-between relative mb-2 mx-4 p-0">
        <img :src="logo" alt="Logo" class="h-24 rounded-full mt-2" />

        <div class="absolute top-10 left-36">
          <h1
            class="text-white text-5xl font-bold tracking-wide [text-shadow:0px_0px_10px_#008080]"
          >
            {{ greetingMessage }}
          </h1>
        </div>

        <div class="absolute top-5 right-0 flex items-center space-x-4 mt-2">
          <div v-if="currentUser" class="relative">
            <button @mouseenter="showMenu" @mouseleave="hideMenu" class="p-2 bg-gray-500 hover:bg-gray-600 rounded">
              ☰
            </button>
            <div
              v-if="menuOpen"
              class="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-20"
            >
              <button
                class="block w-full text-left px-4 py-2 hover:bg-gray-300"
                @click="emitAction('join')"
              >
                Join Group
              </button>
              <button
                class="block w-full text-left px-4 py-2 hover:bg-gray-300"
                @click="emitAction('view')"
              >
                {{ leaderboardButtonText}}
              </button>
            </div>
          </div>
          <button
            v-if="!props.currentUser"
            @click="handleLoginClick"
            class="bg-blue-500 text-teal-300 border-2 border-teal-300 px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-teal-200 hover:border-teal-200 transition-all duration-200"
          >
            Login
          </button>
          <button
            v-if="props.currentUser"
            @click="handleLogoutClick"
            class="bg-blue-500 text-teal-300 border-2 border-teal-300 px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-teal-200 hover:border-teal-200 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <div
      v-if="!props.currentUser"
      class="w-full bg-[url('../assets/images/navbar_bg3.jpeg')] bg-no-repeat shadow-md box-border h-[52rem] mb-32"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <h1
          class="text-white text-6xl font-bold tracking-wide [text-shadow:0px_0px_20px_#FFD700] drop-shadow-lg"
        >
          LEAGUE OF LEGENDS
        </h1>
      </div>
    </div>
  </div>
</template>
