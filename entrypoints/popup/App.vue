<script lang="ts" setup>
import type { ImageType } from '@/utils/settings'
import { storage } from '#imports'
import { computed, onMounted, ref, watch } from 'vue'
import { captureScreenshot, getActiveTabId, readFilename } from '@/utils'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  MAX_IMAGE_QUALITY,
  MIN_IMAGE_QUALITY,
  SUPPORTED_IMAGE_TYPES,
} from '@/utils/settings'

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WEBP',
}

const shortcut = ref<string | null>(null)
const copyToClipboard = ref(DEFAULT_SETTINGS.copyToClipboard)
const imageType = ref<ImageType>(DEFAULT_SETTINGS.imageType)
const imageQuality = ref<number>(DEFAULT_SETTINGS.imageQuality)
const status = ref('')
const busy = ref(false)

// 设置读回来之前不要把默认值写回存储
const settingsLoaded = ref(false)

// 质量参数只对有损格式有意义
const qualityEnabled = computed(() => imageType.value !== 'image/png')

async function withActiveTab(action: (tabId: number) => Promise<void>) {
  const tabId = await getActiveTabId()
  if (tabId === undefined) {
    status.value = '没有找到当前标签页'
    return
  }
  busy.value = true
  try {
    await action(tabId)
  }
  finally {
    busy.value = false
  }
}

function showPlaybackInfo() {
  return withActiveTab(async (tabId) => {
    const result = await readFilename(tabId)
    status.value = result.ok ? result.filename : result.message
  })
}

function capture() {
  return withActiveTab(async (tabId) => {
    status.value = '截图中…'
    const ok = await captureScreenshot(tabId)
    status.value = ok ? '已保存到下载目录' : '截图失败，详情见页面提示'
  })
}

onMounted(async () => {
  try {
    const commands = await browser.commands.getAll()
    shortcut.value = commands.find(cmd => cmd.name === 'take_screenshot')?.shortcut || null
  }
  catch {
    shortcut.value = null
  }

  const settings = await loadSettings()
  copyToClipboard.value = settings.copyToClipboard
  imageType.value = settings.imageType
  imageQuality.value = settings.imageQuality
  settingsLoaded.value = true
})

watch(copyToClipboard, async (value) => {
  if (settingsLoaded.value)
    await storage.setItem('local:copyToClipboard', value)
})

watch(imageType, async (value) => {
  if (settingsLoaded.value)
    await storage.setItem('local:imageType', value)
})

watch(imageQuality, async (value) => {
  if (settingsLoaded.value)
    await storage.setItem<number>('local:imageQuality', Number(value))
})
</script>

<template>
  <main>
    <h1>Plex 一键截图</h1>

    <div class="actions">
      <button type="button" :disabled="busy" @click="capture">
        截图并下载
      </button>
      <button type="button" class="secondary" :disabled="busy" @click="showPlaybackInfo">
        获取播放信息
      </button>
    </div>

    <p class="shortcut">
      快捷键：<kbd>{{ shortcut || "未设置" }}</kbd>
      <span class="hint">可在 <code>chrome://extensions/shortcuts</code> 中修改</span>
    </p>

    <p v-if="status" class="status">
      {{ status }}
    </p>

    <hr>

    <label class="row">
      <input v-model="copyToClipboard" type="checkbox">
      <span>截图后复制到剪贴板<span class="hint">（需 HTTPS，始终以 PNG 复制）</span></span>
    </label>

    <fieldset>
      <legend>图片格式</legend>
      <label v-for="type in SUPPORTED_IMAGE_TYPES" :key="type" class="row">
        <input v-model="imageType" type="radio" :value="type">
        <span>{{ IMAGE_TYPE_LABELS[type] }}</span>
      </label>
    </fieldset>

    <fieldset :disabled="!qualityEnabled">
      <legend>
        图片质量
        <span class="hint">{{ qualityEnabled ? imageQuality.toFixed(2) : "PNG 无损，不适用" }}</span>
      </legend>
      <input
        v-model.number="imageQuality"
        type="range"
        :min="MIN_IMAGE_QUALITY"
        :max="MAX_IMAGE_QUALITY"
        step="0.05"
      >
    </fieldset>
  </main>
</template>
