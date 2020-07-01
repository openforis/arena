const { openBrowser, write, closeBrowser, goto, press, text, focus, textBox, inputField, toRightOf } = require('taiko');

describe('Getting Started with Jest and Taiko', () => {

  beforeAll(async () => {
    await openBrowser({ headless: false });

  });

  describe('Search Taiko Repository', () => {

    test('Goto getgauge github page', async () => {
      await goto('https://github.com/getgauge');
    });

    test('Search for "Taiko"', async () => {
      await focus(textBox(/Search/))
      await write('Taiko');
      await press('Enter');
    });

    test('Page contains "getgauge/taiko"', async () => {
      await expect(text('getgauge/taiko').exists()).toBeTruthy();
    });

  });

  afterAll(async () => {
    await closeBrowser();
  });

});