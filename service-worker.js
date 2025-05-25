chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command "${command}" triggered`);
  if (command === "take_screenshot") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["capture.js"],
    });
  }
});
