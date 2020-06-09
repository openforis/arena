/* globals beforeSuite, afterSuite */
const { $, waitFor, openBrowser, currentURL, closeBrowser, text } = require('taiko')
const { expect } = require('chai')

const headless = Boolean(process.env.headless_chrome.toLowerCase())

beforeSuite(async () => {
  await openBrowser({
    headless,
    args: headless
      ? [
          // These are recommended args that has to be passed when running in Docker
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
        ]
      : [],
  })
})

afterSuite(async () => {
  await closeBrowser()
})

step('Page contains <content>', async (content) => {
  /* eslint-disable no-unused-expressions */
  expect(await text(content).exists()).to.be.true
})

step('Wait for <element> to exist', async (element) => {
  waitFor(async () => !(await $(element).exists()))
})

step('Url contains <str>', async (str) => {
  const url = await currentURL()
  /* eslint-disable no-unused-expressions */
  expect(url.includes(str)).to.be.true
})
