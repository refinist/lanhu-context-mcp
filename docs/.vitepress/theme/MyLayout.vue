<script setup lang="ts">
import { MediumZoom } from 'vitepress-component-medium-zoom';
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout />
  <MediumZoom selector=".vp-doc img:not([data-disable-zoom])" />
</template>
