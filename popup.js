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

  // 截屏按钮：发送消息给 content.js
  if (capture) {
    capture.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.tabs.sendMessage(tab.id, { action: "capture_screenshot" });
    });
  }
});

// 运行在页面上下文中，获取作品名/集数/时间
function getPlexInfo() {
  const title =
    document.querySelector(".PlayerControlsMetadata-container-aTRKIG > a")
      ?.title || "未知作品";
  const episode =
    document.querySelector(".MetadataPosterTitle-isSecondary-lJfKBu")
      ?.innerText || "未知集数";
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
