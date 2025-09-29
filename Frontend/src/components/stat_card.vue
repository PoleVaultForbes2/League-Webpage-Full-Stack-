<script setup>
import { computed } from 'vue';
import Card from './single_card.vue'

const props = defineProps({
  player_stat: {
    type: Array,
    default: () => [],
  },

})

const limitedStats = computed(() => {
  // Returns a new array containing only the first 6 elements
  return props.player_stat.slice(0, 6);
});
</script>

<template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 ">
        <Card v-for="(stat, index) in limitedStats" :key="index" :player_stat="stat" />
      </div>
</template>
