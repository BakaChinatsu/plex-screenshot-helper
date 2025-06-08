<script lang="ts" setup>
const getPlayInfo = async () => {
  console.log("开始获取播放信息");
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tab.id) {
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPlexInfo,
    });
  }
};

const caputer = async () => {
  console.log("开始截屏");
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tab.id) {
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/capture-helper.js"],
    });
  }
};

// 🐾
// 运行在页面上下文中，获取作品名/集数/时间
function getPlexInfo() {
  const title =
    document.querySelector<HTMLElement>(
      "[class^='PlayerControlsMetadata-container'] a"
    )?.title || "未知作品";
  console.log("作品名:", title);
  // 获取副标题
  const container = document.querySelector<HTMLElement>(
    '[class^="PlayerControlsMetadata-container"]'
  );
  const episodeElement = container?.querySelector<HTMLElement>(
    '[class*="isSecondary"]'
  );
  const episode = episodeElement?.innerText?.trim() || "未知集数";
  console.log("集数与副标题:", episode);

  const video = document.querySelector("video");
  const currentTime = video ? formatTime(video.currentTime) : "未知时间";

  function formatTime(t: number) {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(Math.floor(t % 60)).padStart(2, "0");
    return `${h}_${m}_${s}`;
  }

  const filename = `[${title}] - ${episode} - ${currentTime}.png`;
  alert("建议文件名：" + filename);
}

import { ref, onMounted } from "vue";
const shortcut = ref<string | null>(null);

onMounted(async () => {
  try {
    const commands = await browser.commands.getAll();
    const captureCommand = commands.find(
      (cmd) => cmd.name === "take_screenshot"
    );
    shortcut.value = captureCommand?.shortcut ?? null;
  } catch (e) {
    console.error("获取快捷键失败:", e);
    shortcut.value = "加载失败";
  }
});
</script>

<template>
  <h3>Plex Player 一键截图</h3>
  <p><button @click="getPlayInfo">获取播放信息</button></p>
  <p>
    <button @click="caputer">
      截图并下载（{{ shortcut || "快捷键未设置" }}）
    </button>
  </p>
  <p>Tip: 可以在 <code>chrome://extensions/shortcuts</code> 中更改快捷键</p>
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
