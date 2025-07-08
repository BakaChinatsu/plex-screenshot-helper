<script lang="ts" setup>
import { storage } from '#imports'
import { onMounted, ref, watch } from 'vue'
import utils from '@/utils'

const shortcut = ref<string | null>(null)
const copyToClipboard = ref(false)
const imageType = ref<string>('image/png')
// const quality = ref<number>(100)

async function getPlayInfo() {
  console.log('开始获取播放信息')
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  if (tab.id) {
    const filename = await utils.getFilename(tab.id)
    // eslint-disable-next-line no-alert
    alert(`建议的文件名: ${filename}`)
  }
}

async function capture() {
  console.log('开始截屏')
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  if (tab.id) {
    const filename = await utils.getFilename(tab.id)
    await utils.capture(tab.id, filename, imageType.value)
  }
}

// 在组件挂载时获取快捷键和存储设置
onMounted(async () => {
  try {
    const commands = await browser.commands.getAll()
    const captureCommand = commands.find(
      cmd => cmd.name === 'take_screenshot',
    )
    shortcut.value = captureCommand?.shortcut ?? null
  }
  catch (e) {
    console.error('获取快捷键失败:', e)
    shortcut.value = '加载失败'
  }

  // 从存储中读取设置
  copyToClipboard.value = await storage.getItem('local:copyToClipboard', {
    fallback: false,
  })
  imageType.value = await storage.getItem('local:imageType', {
    fallback: 'image/png',
  })
})

// 监听 copyToClipboard 的变化并保存到存储
watch(copyToClipboard, async (newValue) => {
  try {
    await storage.setItem('local:copyToClipboard', newValue)
    console.log('设置已保存:', newValue)
  }
  catch (e) {
    console.error('保存设置失败:', e)
  }
})
// 监听 imageType 的变化并保存到存储
watch(imageType, async (newValue) => {
  try {
    await storage.setItem('local:imageType', newValue)
    console.log('图片类型已保存:', newValue)
    console.log('imageType.value:', imageType.value, typeof imageType.value)
  }
  catch (e) {
    console.error('保存图片类型失败:', e)
  }
})
</script>

<template>
  <h3>Plex Player 一键截图</h3>
  <p>
    <button @click="getPlayInfo">
      获取播放信息
    </button>
  </p>
  <p>
    <button @click="capture">
      截图并下载（{{ shortcut || "快捷键未设置" }}）
    </button><br>
    <input id="checkbox" v-model="copyToClipboard" type="checkbox">
    <label for="checkbox">截图后复制至剪切板</label>
  </p>
  <p>Tip: 可以在 <code>chrome://extensions/shortcuts</code> 中更改快捷键</p>
  <div>ImageType: {{ imageType }}</div>

  <input id="png" v-model="imageType" type="radio" value="image/png">
  <label for="png">PNG</label>
  <input id="jpeg" v-model="imageType" type="radio" value="image/jpeg">
  <label for="jpeg">JPEG</label>
  <input id="webp" v-model="imageType" type="radio" value="image/webp">
  <label for="webp">WEBP</label>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #54bc4ae0);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
