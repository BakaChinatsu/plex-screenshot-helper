import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    manifest_version: 3,
    name: "Plex Screenshot Helper",
    version: "1.0",
    description: "一键截图并命名 Plex 画面",
    permissions: ["scripting", "activeTab"],
    host_permissions: ["<all_urls>"],

    action: {
      default_popup: "popup/popup.html",
      default_title: "Plex Screenshot Helper",
    },

    background: {
      service_worker: "background.ts",
      type: "module",
    },

    // content_scripts: [
    //   {
    //     matches: ["<all_urls>"],
    //     js: ["content.ts"],
    //   },
    // ],

    commands: {
      take_screenshot: {
        suggested_key: {
          default: "Ctrl+Shift+Z",
          // mac: "Command+Shift+Z",
        },
        description: "截图并保存播放器画面",
      },
    },
  },
});
