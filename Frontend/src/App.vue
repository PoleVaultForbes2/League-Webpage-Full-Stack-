<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './components/nav_bar.vue'
import Statcard from './components/stat_card.vue'
import LoginForm from './components/login_form.vue'
import GroupLeaderboard from './components/group_leaderboard.vue'
import { getRecentMatches, syncMatches } from './services/matchService.js'

const API_BASE = import.meta.env.VITE_API_URL;
// Global tracking variables
const currentUser = ref(null);
const summonerStats = ref([]);
const isLoading = ref(false);

const showLogin = ref(false);
const leaderboard = ref({ topKDA: [], topWinRate: [] });

const showGroups = ref(false);
const lastAction = ref(""); // 'join' or 'view'
const showGroupLeaderboard = ref(false);
const groupName = ref("");

// *** Gets the stats from the database stats.js ***
async function fetchLeaderboard(groupName = "*all") {
  const res = await fetch(`${API_BASE}/api/leaderboard?groupName=${encodeURIComponent(groupName)}`);
  if (res.ok) {
    leaderboard.value = await res.json();
  }
}

// *** Function to handle login by fetching username and password from the database ***
async function handleLogin({ username, password }) {
  isLoading.value = true;

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( {username, password}),
  });

  const data = await res.json();
  if(!res.ok){
    alert(data.error || "Login failed");
    return;
  }

  localStorage.setItem("token", data.token); // saves the JWT token
  currentUser.value = { username: data.username};
  showLogin.value = false;
  showGroups.value = false;

  // After login, try database for riot info otherwise call api
  let matches = await getRecentMatches(data.username);

  if(!matches || matches.length < 3){
    console.log('No matches found or insufficient matches, syncing with Riot API...');
      try {
        await syncMatches(data.username);
        console.log('Sync completed');

        // Fetch matches again after sync
        matches = await getRecentMatches(data.username);
      } catch (syncError) {
        console.error('Sync failed:', syncError);
        // Continue with whatever matches we have
      }
    } else {
      // Even if we have matches, try to sync (but it will only update if it's a new day)
      try {
        await syncMatches(data.username);
        // Refresh matches in case new ones were added
        matches = await getRecentMatches(data.username);
      } catch (syncError) {
        console.error('Daily sync check failed:', syncError);
        // Continue with existing matches
      }
    }
  summonerStats.value = matches || [];
  isLoading.value = false;
}

// *** Function to handle signup ***
async function handleSignup({ username, password, tag_line }) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tag_line}),
  });

  if(!res.ok) {
    alert("Singup failed");
    return;
  }
  alert("Account created! Please login");
}

// *** Helper functions for assigning values ***
function handleLogout() {
  currentUser.value = null
  summonerStats.value = []
  localStorage.removeItem("token");

  showGroupLeaderboard.value = false;
  groupName.value = "";
  lastAction.value = "";
}

// *** Manual refresh function for users who want to force update ***
async function refreshMatches() {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    console.log('Manually refreshing matches...');
    await syncMatches(currentUser.value.username);
    const matches = await getRecentMatches(currentUser.value.username);
    summonerStats.value = matches || [];
    console.log('Manual refresh completed');
  } catch (error) {
    console.error('Manual refresh failed:', error);
    alert('Failed to refresh matches. Please try again later.');
  } finally {
    isLoading.value = false;
  }
}

function openLogin(){
  showLogin.value = true
}

function closeLogin(){
  showLogin.value = false
}

// *** Function for handling action & turning on/off leaderboard view ***
function handleMenuAction(action, name){
  lastAction.value = `${action}-${Date.now()}`;
  groupName.value = name;

  if(action === "view"){
    showGroupLeaderboard.value = !showGroupLeaderboard.value;
  }
}

// *** Get leaderboard stats to display ***
onMounted(() => {
  fetchLeaderboard();
});
</script>

<template>
  <div>
    <Navbar @open-login="openLogin" @logout="handleLogout" @menuAction="handleMenuAction" :current-user="currentUser"/>
    <!-- Model Overlay -->
     <div v-show="showLogin" @click="closeLogin" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div @click.stop class="relative">
        <!-- Close Button -->
         <button @click="closeLogin"  class="absolute -top-4 -right-4 bg-gray-100 white text-gray-600 hover:text-gray-800 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500 transition-all duration-200 shadow-lg z-10" type="button">
          X
         </button>

         <LoginForm @login="handleLogin" @signup="handleSignup" class="animate-fade-in"></LoginForm>
      </div>
     </div>

    <div class="p-6 mb-24" v-if="!currentUser && !showLogin">
      <!-- Information sections -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- What is this page? -->
        <div class="bg-gray-800 bg-opacity-25 border border-teal-600 rounded-lg p-8 max-h-screen h-full">
          <h2 class="text-4xl font-bold text-white mb-4 [text-shadow:0px_0px_10px_#008080]">What is this page?</h2>
          <div class="text-left text-white">
            <p class="text-2xl leading-relaxed">
              This is a League of Legends stats tracker that allows you to view your recent match history,
              performance statistics, and game analytics. Connect your Riot account to see detailed insights
              about your gameplay, champion performance, and match results. You can also join a group and compare
              stats with your frineds!
            </p>
          </div>
        </div>

        <!-- What tools were used -->
        <div class="bg-gray-800 bg-opacity-25 border border-teal-600 rounded-lg p-8">
          <h2 class="text-4xl font-bold text-white mb-4 [text-shadow:0px_0px_10px_#008080]" >What tools were used</h2>
          <div class="text-left text-white">
            <p class="text-2xl leading-relaxed">
              Built with Vue.js 3 for the frontend interface, Node.js and Express for the backend API,
              and integrated with the official Riot Games API to fetch live match data. The application
              uses JWT authentication for secure user sessions and stores match history in a Postgres database
              for faster loading times and group management.
            </p>
          </div>
        </div>

        <!-- How to use -->
        <div class="bg-gray-800 bg-opacity-25 border border-teal-600 rounded-lg p-8">
          <h2 class="text-4xl font-bold text-white mb-4 [text-shadow:0px_0px_10px_#008080]">How to use</h2>
          <div class="text-left text-white">
            <p class="text-2xl leading-relaxed">
              Click the "Login" button in the navbar to create an account or sign in. Enter your Riot ID
              and tag line during signup. Once logged in, the system will automatically fetch and display
              your recent match history, showing detailed statistics for each game including KDA, items,
              and match duration. Type in a Group Name to create/join a group you want to be apart of. Then
              you can view the groups information statistics!
            </p>
          </div>
        </div>

      </div>

      <!-- Leaderboard Display -->
      <div class="p-6">
        <h2 class="text-3xl font-bold text-center text-white mb-4">Top Players Today</h2>

        <!-- Top 3 by KDA -->
        <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-6">
          <h3 class="text-2xl font-semibold text-teal-400 mb-2">Best KDA (last 5 games)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(player, index) in leaderboard.topKDA" :key="player.username"
                class="bg-gray-900 rounded-lg p-4 text-center shadow-md">
              <p class="text-xl font-bold text-white">{{ index + 1}}. {{ player.username }}</p>
              <p class="text-lg text-teal-300">KDA: {{ player.kda }}</p>
            </div>
          </div>
        </div>

        <!-- Top 3 by Win Rate -->
        <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4">
          <h3 class="text-2xl font-semibold text-teal-400 mb-2">Best Win Rate (last 5 games)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(player, index) in leaderboard.topWinRate" :key="player.username"
                class="bg-gray-900 rounded-lg p-4 text-center shadow-md">
              <p class="text-xl font-bold text-white">{{ index + 1 }}. {{ player.username }}</p>
              <p class="text-lg text-teal-300">Win Rate: {{ player.winRate }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Stats -->
    <div v-if="currentUser" class="flex justify-between items-center mb-5 mt-10 px-6">
      <h2 class="text-5xl font-bold text-teal-500 text-center flex-1">League Data</h2>
    </div>

    <div class="p-6" v-if="currentUser && !showGroups">
      <Statcard :player_stat="summonerStats" />
    </div>

    <!-- Group Stats -->
    <GroupLeaderboard v-if="currentUser" :current-user="currentUser" :api-base="API_BASE" :action="lastAction" :group-name="groupName" />
    </div>
    <button
        v-if="currentUser"
        @click="refreshMatches"
        :disabled="isLoading"
        class="fixed bottom-1 right-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium border-2 border-teal-300 transition-colors duration-200 z-10"
      >
        {{ isLoading ? 'Updating...' : 'Refresh Stats' }}
    </button>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
