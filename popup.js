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
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: capturePlexScreenshot,
      });
    });
  }
});

// 🐾
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

// content.js：运行在 Plex 网页中，监听消息并执行截图

// 直接从 video 元素截图
function capturePlexScreenshot() {
  // 格式化时间为 00_11_53
  function formatTime(t) {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(Math.floor(t % 60)).padStart(2, "0");
    return `${h}_${m}_${s}`;
  }

  // 生成截图用的文件名
  function getPlexScreenshotFilename() {
    const title =
      document.querySelector(".PlayerControlsMetadata-container-aTRKIG > a")
        ?.title || "未知作品";
    const episode =
      document.querySelector(".MetadataPosterTitle-isSecondary-lJfKBu")
        ?.innerText || "未知集数";
    const video = document.querySelector("video");
    const currentTime = video ? formatTime(video.currentTime) : "未知时间";

    return `[${title}] - ${episode} - ${currentTime}.png`;
  }

  const video = document.querySelector("video");
  console.log(video);
  if (!video) {
    alert("找不到视频播放器");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  console.log("after drawImage");

  canvas.toBlob((blob) => {
    const filename = getPlexScreenshotFilename();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// 接收 popup.js 发来的截图请求
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "capture_screenshot") {
//     capturePlexScreenshot();
//   }
// });
