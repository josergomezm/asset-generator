<template>
  <div class="w-full">
    <div
      ref="dropZone"
      class="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      :class="{
        'border-blue-400 bg-blue-50': isDragOver,
        'border-red-400 bg-red-50': hasError
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="accept"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="!uploading">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div class="mt-4">
          <p class="text-sm text-gray-600">
            <span class="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
              Click to upload
            </span>
            or drag and drop
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{ acceptText }}
          </p>
        </div>
      </div>

      <div v-else class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-sm text-gray-600">Uploading...</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <!-- File Preview -->
    <div v-if="previewFiles.length > 0" class="mt-4">
      <h4 class="text-sm font-medium text-gray-900 mb-2">Selected Files:</h4>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="(file, index) in previewFiles"
          :key="index"
          class="relative group"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              v-if="file.preview"
              :src="file.preview"
              :alt="file.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-3-3v6m5-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            @click="removeFile(index)"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            ×
          </button>
          <p class="mt-1 text-xs text-gray-500 truncate">{{ file.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface FileWithPreview {
  file: File
  name: string
  preview?: string
}

interface Props {
  multiple?: boolean
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  accept: 'image/*',
  maxSize: 10,
  maxFiles: 5
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
  error: [message: string]
}>()

const dropZone = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const previewFiles = ref<FileWithPreview[]>([])

const hasError = computed(() => !!errorMessage.value)
const acceptText = computed(() => {
  if (props.accept === 'image/*') {
    return `PNG, JPG, GIF up to ${props.maxSize}MB`
  }
  return `${props.accept} up to ${props.maxSize}MB`
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  // Only set to false if we're leaving the drop zone itself
  if (!dropZone.value?.contains(e.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)
}

function processFiles(files: File[]) {
  errorMessage.value = ''
  
  // Validate file count
  const totalFiles = previewFiles.value.length + files.length
  if (totalFiles > props.maxFiles) {
    errorMessage.value = `Maximum ${props.maxFiles} files allowed`
    emit('error', errorMessage.value)
    return
  }

  // Validate and process each file
  const validFiles: File[] = []
  const newPreviewFiles: FileWithPreview[] = []

  for (const file of files) {
    // Validate file type
    if (props.accept !== '*' && !file.type.match(props.accept.replace('*', '.*'))) {
      errorMessage.value = `Invalid file type: ${file.name}`
      emit('error', errorMessage.value)
      continue
    }

    // Validate file size
    if (file.size > props.maxSize * 1024 * 1024) {
      errorMessage.value = `File too large: ${file.name} (max ${props.maxSize}MB)`
      emit('error', errorMessage.value)
      continue
    }

    validFiles.push(file)
    
    // Create preview for images
    const fileWithPreview: FileWithPreview = {
      file,
      name: file.name
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileWithPreview.preview = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }

    newPreviewFiles.push(fileWithPreview)
  }

  if (validFiles.length > 0) {
    previewFiles.value.push(...newPreviewFiles)
    emit('filesSelected', validFiles)
  }

  // Clear the input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function removeFile(index: number) {
  const removedFile = previewFiles.value.splice(index, 1)[0]
  
  // Revoke object URL to prevent memory leaks
  if (removedFile.preview) {
    URL.revokeObjectURL(removedFile.preview)
  }

  // Emit updated file list
  const remainingFiles = previewFiles.value.map(f => f.file)
  emit('filesSelected', remainingFiles)
}

function clearFiles() {
  // Revoke all object URLs
  previewFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  
  previewFiles.value = []
  errorMessage.value = ''
  emit('filesSelected', [])
}

// Cleanup on unmount
onUnmounted(() => {
  previewFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
})

// Expose methods
defineExpose({
  clearFiles
})
</script>