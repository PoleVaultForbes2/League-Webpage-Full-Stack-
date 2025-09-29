<script setup>
import { defineProps } from 'vue'

defineProps({
  player_stat:{
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="bg-gradient-to-tr from-[#1418e6] to-[#0d045f] p-8 rounded-xl shadow-md relative">
    <div class="p-4">
      <!-- Champion played -->
      <div class="mb-3">
        <h3 class="text-2xl font-bold text-yellow-400">{{ player_stat.champion }}</h3>
      </div>

      <!-- KDA -->
      <div class="text-white mb-4">
        <p>Kills: {{ player_stat.kills }}</p>
        <p>Deaths: {{ player_stat.deaths }}</p>
        <p>Assists: {{ player_stat.assists }}</p>
      </div>

      <!-- Win / Loss -->
      <h3
        :class="player_stat.win ? 'text-green-300' : 'text-red-500'"
        class="text-xl font-bold"
      >
        {{ player_stat.win ? 'Victory' : 'Defeat' }}
      </h3>
    </div>
  </div>
</template>
