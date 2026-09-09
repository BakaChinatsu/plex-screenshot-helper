import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  // MV3/MV2 由构建目标决定（--mv2/--mv3），不在 manifest 里写死
  manifest: {
    name: 'Plex Screenshot Helper',
    description: '一键截图并命名 Plex 画面',
    permissions: [
      'scripting',
      'activeTab',
      'storage',
      'clipboardWrite',
    ],
    host_permissions: ['<all_urls>'],

    // default_popup 由 entrypoints/popup 自动推导，这里只补充标题
    action: {
      default_title: 'Plex Screenshot Helper',
    },

    background: {
      service_worker: 'background.ts',
      type: 'module',
    },

    // 没有常驻 content script：截图逻辑在用户触发时才用 scripting.executeScript 注入

    commands: {
      take_screenshot: {
        suggested_key: {
          default: 'Alt+Shift+Z',
          // mac: "Option+Shift+Z",
        },
        description: '截图并保存播放器画面',
      },
    },
  },
})
