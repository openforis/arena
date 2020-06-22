const { $, waitFor, click, currentURL, text } = require('taiko')
const { expect } = require('chai')

step('Page contains <content>', async (content) => {
  /* eslint-disable no-unused-expressions */
  expect(await text(content).exists()).to.be.true
})

step('Click on <content>', async (content) => {
  await click(content)
})

step('Wait for <element> to exist', async (element) => {
  waitFor(async () => !(await $(element).exists()))
})

step('Wait for load complete', async () => {
  // TODO it should be improved: wait for the loader div to disappear
  // await waitFor(async () => await waitFor($('.loader).exists()))
  await waitFor(5000)
})

step('Url contains <str>', async (str) => {
  const url = await currentURL()
  /* eslint-disable no-unused-expressions */
  expect(url.includes(str)).to.be.true
})
