<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from './components/AppLayout.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useToast } from './composables/useToast'

const toastContainer = ref()
const { setToastContainer } = useToast()

onMounted(() => {
  if (toastContainer.value) {
    setToastContainer(toastContainer.value)
  }
})
</script>

<template>
  <AppLayout />
  <ToastContainer ref="toastContainer" />
</template>
