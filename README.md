# Plex Screenshot Helper（Plex 一键截图助手）

A simple Chrome/FireFox extension that lets you capture Plex (and more web video player) video screenshots with filenames containing the title, season·episode, episode title, and timestamp.

一个简单的 Chrome/FireFox 插件，支持在 Plex（以及更多网页播放器）中一键截取当前播放画面，并自动以“作品名 + 季·集数 + 标题 + 播放时间”为文件名保存截图。

e.g.

```
[ガールズバンドクライ] - シーズン1·第2話—夜行性の生き物3匹 - 00_18_36.png
[転生王女と天才令嬢の魔法革命] - 第1季·第2集—趣味と実益の助手獲得 - 00_05_47.png
[負けヒロインが多すぎる!] - S1·E1—プロ幼馴染み八奈見杏菜の負けっぷり - 00_05_27.png
[【original anime MV】幽霊船戦【hololive_宝鐘マリン】 - YouTube] - - - 00_01_05.webp

```

---

## Features / 功能

- Capture video frame directly from the Plex player
- Automatically name the file as `[Title] - [Season·Episode]-[Episode title] - [Timestamp].png`
- Works via button click or keyboard shortcut
- Supports selecting the image format for download (PNG, JPEG, WEBP)
- Supports setting screenshot quality (only for JPEG and WEBP formats)
- Supports copying the screenshot to clipboard (optional, due to browser API limitations，requires HTTPS environment, and always copies as PNG regardless of image type setting)
- Show Toast notifications on success or failure of clipboard copy
- Now supports more video player pages (like YouTube, bilibili, mux player (#4), etc.), automatically using the current page title and timestamp as the filename

- 直接从 Plex 播放器截取视频画面
- 自动命名截图文件为 `[作品名] - [第几季·第几集]-[本集标题] - [时间戳].png`
- 支持点击按钮或快捷键触发截图
- 支持选择下载图片的类型（支持 PNG、JPEG 和 WEBP）
- 支持设置截图质量（仅适用于 JPEG 和 WEBP 格式）
- 支持复制截图到剪贴板(可选，由于浏览器 API 限制需要 HTTPS 环境，且无论图片类型设置如何都以 PNG 格式复制)
- 复制至剪切板成功或失败时显示 Toast 提示
- 现在支持更多视频播放器页面的截图（如 YouTube, bilibili，mux player(#4) 等），会自动使用当前页面标题和时间戳作为文件名

## Tips / 使用提示

Default shortcut key is Alt+Shift+Z, MacOS is ⌥+⇧+Z<br>
You can change the shortcut in Chrome extensions settings (access via `chrome://extensions/shortcuts`)

默认快捷键为 Alt+Shift+Z，MacOS 为 ⌥+⇧+Z<br>
可以在 Chrome 扩展设置中更改快捷键 (访问 `chrome://extensions/shortcuts`)
