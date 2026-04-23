<script setup lang="ts">
import { useData } from 'vitepress';
import { MediumZoom } from 'vitepress-component-medium-zoom';
import DefaultTheme from 'vitepress/theme';
import { nextTick, provide } from 'vue';

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    callback: () => Promise<void> | void
  ) => {
    ready: Promise<void>;
  };
};

const { Layout } = DefaultTheme;
const { isDark } = useData();

function enableTransitions(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const doc = document as ViewTransitionDocument;

  return (
    typeof doc.startViewTransition === 'function' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  );
}

provide('toggle-appearance', async (event: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value;
    return;
  }

  const x = Number.isFinite(event?.clientX)
    ? event.clientX
    : window.innerWidth / 2;
  const y = Number.isFinite(event?.clientY)
    ? event.clientY
    : window.innerHeight / 2;
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${maxRadius}px at ${x}px ${y}px)`
  ];
  const doc = document as ViewTransitionDocument;
  const transition = doc.startViewTransition!(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  });

  await transition.ready;

  document.documentElement.animate(
    {
      clipPath: isDark.value ? [...clipPath].reverse() : clipPath
    },
    {
      duration: 450,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
    }
  );
});
</script>

<template>
  <Layout />
  <MediumZoom selector=".vp-doc img:not([data-disable-zoom])" />
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>
