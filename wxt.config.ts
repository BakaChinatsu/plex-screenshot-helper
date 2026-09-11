import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],

  zip: {
    // sources zip 是给 Firefox 审核复现构建用的，文档不是构建所需的源码。
    // 另外 WXT 只认 .gitignore，不认 .git/info/exclude，未跟踪的本地文件也会被打进去。
    excludeSources: ['docs/**'],
  },

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
