<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  currentUser: { type: Object, required: true },
  apiBase: { type: String, required: true },
  action: { type: String, default: ""},
  groupName: { type: String, default: ""},
});

const groupData = ref(null);
const showGroupLeaderboard = ref(false);

// *** Function for joining group ***
async function joinGroup() {
  try {
    const res = await fetch(`${props.apiBase}/api/groups/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: props.currentUser.username,
        groupName: props.groupName,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to join group");
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error joining group:", err);
    alert("Error joining group");
  }
}

// *** Function for getting the groups data ***
async function getGroupData() {
  try {
    const res = await fetch(
      `${props.apiBase}/api/leaderboard?groupName=${props.groupName}`
    );
    if (!res.ok) {
      alert("Failed to fetch group leaderboard");
      return;
    }

    groupData.value = await res.json();
  } catch (err) {
    console.error("Error fetching group data:", err);
    alert("Error loading group leaderboard");
  }
}

// *** Watch for navbar action ('join' or 'view') ***
watch(
  () => props.action,
  (newAction) => {

    const actualAction = newAction.split('-')[0];
    if(actualAction === "join") joinGroup();
    if(actualAction === "view") {
      showGroupLeaderboard.value = !showGroupLeaderboard.value;
      getGroupData();
    }
  }
);
</script>

<template>
  <!-- Group Leaderboard Display -->
<div v-if="showGroupLeaderboard" class="p-6">
  <div v-if="groupData" class="mt-4">
    <h2 class="text-3xl font-bold text-center text-white mb-4">{{ groupName }} Group Leaderboard</h2>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- KDA Column -->
      <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4">
        <h3 class="text-2xl font-semibold text-teal-400 mb-4 text-center">Best KDA (last 5 games)</h3>
        <div class="space-y-3">
          <div v-for="(player, i) in groupData.topKDA" :key="i"
              class="bg-gray-900 rounded-lg p-4 text-center shadow-md">
            <p class="text-xl font-bold text-white">{{ player.username }}</p>
            <p class="text-lg text-teal-300">KDA: {{ player.kda }}</p>
          </div>
        </div>
      </div>

      <!-- Win Rate Column -->
      <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4">
        <h3 class="text-2xl font-semibold text-teal-400 mb-4 text-center">Best Win Rate (last 5 games)</h3>
        <div class="space-y-3">
          <div v-for="(player, i) in groupData.topWinRate" :key="i"
              class="bg-gray-900 rounded-lg p-4 text-center shadow-md">
            <p class="text-xl font-bold text-white">{{ player.username }}</p>
            <p class="text-lg text-teal-300">Win Rate: {{ player.winRate }}%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>
