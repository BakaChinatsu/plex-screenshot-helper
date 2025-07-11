import utils from '@/utils'

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })
  browser.commands.onCommand.addListener(async (command) => {
    console.log(`Command "${command}" triggered`)
    if (command === 'take_screenshot') {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (tab.id) {
        const filename = await utils.getFilename(tab.id)

        await utils.capture(tab.id, filename)
      }
    }
  })
})
