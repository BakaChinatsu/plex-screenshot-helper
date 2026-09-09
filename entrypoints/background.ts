import { captureScreenshot, getActiveTabId } from '@/utils'

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'take_screenshot')
      return

    const tabId = await getActiveTabId()
    if (tabId !== undefined)
      await captureScreenshot(tabId)
  })
})
