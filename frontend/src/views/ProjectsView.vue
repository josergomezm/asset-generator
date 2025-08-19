<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div class="flex-auto">
        <h1 class="text-xl sm:text-2xl font-semibold leading-6 text-gray-900">Projects</h1>
        <p class="mt-2 text-sm text-gray-700">
          Manage your asset generation projects and maintain consistent art styles.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button type="button" @click="openCreateForm"
          class="w-full sm:w-auto block rounded-md bg-blue-600 px-4 py-3 sm:px-3 sm:py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 touch-manipulation">
          Create Project
        </button>
      </div>
    </div>

    <div class="mt-8">
      <ProjectList ref="projectListRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectList from '../components/ProjectList.vue'

const projectListRef = ref<InstanceType<typeof ProjectList>>()

function openCreateForm() {
  projectListRef.value?.openCreateForm()
}
</script>