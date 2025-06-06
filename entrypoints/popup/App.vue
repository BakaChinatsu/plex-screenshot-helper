<script lang="ts" setup>
import HelloWorld from "@/components/HelloWorld.vue";

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
      ".PlayerControlsMetadata-container-aTRKIG > a"
    )?.title || "未知作品";
  const episode =
    document.querySelector<HTMLElement>(
      ".MetadataPosterTitle-isSecondary-lJfKBu"
    )?.innerText || "未知集数";
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
</script>

<template>
  <h3>一键截图</h3>
  <button @click="getPlayInfo">获取播放信息</button>
  <button @click="caputer">截屏并下载（Ctrl+Shift+Z）</button>
  <p id="result"></p>
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
