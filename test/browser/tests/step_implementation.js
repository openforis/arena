/* globals beforeSuite, afterSuite */
const { $, waitFor, openBrowser, currentURL, closeBrowser, text } = require('taiko')
const assert = require('assert')

const headless = Boolean(process.env.headless_chrome.toLowerCase())

beforeSuite(async () => {
  await openBrowser({ headless, args: headless ? ['--no-sandbox'] : [] })
})

afterSuite(async () => {
  await closeBrowser()
})

step('Page contains <content>', async (content) => {
  assert.ok(await text(content).exists())
})

step('Wait for <element> to exist', async (element) => {
  waitFor(async () => !(await $(element).exists()))
})

step('Url contains <str>', async (str) => {
  const url = await currentURL()
  assert.ok(url.includes(str))
})
