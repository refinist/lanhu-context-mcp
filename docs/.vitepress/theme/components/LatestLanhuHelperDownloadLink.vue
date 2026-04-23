<script setup lang="ts">
import { latestLanhuHelperDownload } from '../downloads';

defineProps<{
  prefix: string;
  emptyText: string;
}>();
</script>

<template>
  <a v-if="latestLanhuHelperDownload" :href="latestLanhuHelperDownload.href">
    {{ prefix }} {{ latestLanhuHelperDownload.filename }}
  </a>
  <span v-else>{{ emptyText }}</span>
</template>
