// capture.js：运行在 Plex 网页中，监听消息并执行截图

// 直接从 video 元素截图
(function () {
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
})();
