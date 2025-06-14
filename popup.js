// popup.js：控制插件界面按钮行为
console.log("popup.js 已加载");

// 页面加载完成后绑定按钮事件
document.addEventListener("DOMContentLoaded", () => {
  const captureBtn = document.getElementById("captureBtn");
  const capture = document.getElementById("capture");

  // 获取播放信息按钮
  if (captureBtn) {
    captureBtn.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getPlexInfo,
      });
    });
  }

  // 截屏按钮：调用 capture.js 脚本
  if (capture) {
    capture.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["capture.js"],
      });
    });
  }
});

// 🐾
// 运行在页面上下文中，获取作品名/集数/时间
function getPlexInfo() {
  const title =
    document.querySelector("[class^='PlayerControlsMetadata-container'] a")
      ?.title || "未知作品";
  console.log("作品名:", title);
  // 获取副标题
  const container = document.querySelector(
    '[class^="PlayerControlsMetadata-container"]'
  );
  const episodeElement = container?.querySelector('[class*="isSecondary"]');
  const episode = episodeElement?.innerText?.trim() || "未知集数";
  console.log("集数与副标题:", episode);
  const video = document.querySelector("video");
  const currentTime = video ? formatTime(video.currentTime) : "未知时间";

  function formatTime(t) {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(Math.floor(t % 60)).padStart(2, "0");
    return `${h}_${m}_${s}`;
  }

  const filename = `[${title}] - ${episode} - ${currentTime}.png`;
  alert("建议文件名：" + filename);
}
