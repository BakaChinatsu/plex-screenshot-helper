import { captureScreenshotInBackground, getActiveTabId } from '@/utils'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'take-screenshot')
      return
    void captureScreenshotInBackground(message.tabId).then(sendResponse)
    return true
  })

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'take_screenshot')
      return

    const tabId = await getActiveTabId()
    if (tabId !== undefined)
      await captureScreenshotInBackground(tabId)
  })
})
