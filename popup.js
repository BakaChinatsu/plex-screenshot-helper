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
