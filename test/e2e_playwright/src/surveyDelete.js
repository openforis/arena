export default () =>
  describe('Survey Delete', () => {
    it('Delete Survey 2', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      // Click //div[1][normalize-space(.)='survey - SurveyPublish']/button
      await page.click("//div[1][normalize-space(.)='survey - SurveyPublish']/button")

      // Click text="My Surveys"
      await page.click('text="My Surveys"')
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveys/');

      // Click div[role="button"]
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click('div[role="button"]'),
      ])

      // Click text="Delete"
      await page.click('text="Delete"')

      // Click input[type="text"]
      await page.click('input[type="text"]')

      // Fill input[type="text"]
      await page.fill('input[type="text"]', 'survey_2')

      // Click div[role="dialog"] >> text="Delete"
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/surveys/' } */),
        page.click('div[role="dialog"] >> text="Delete"'),
      ])

      await expect(page).toHaveText('Survey survey_2 has been deleted')
    })

    it('Delete Survey 1', async () => {
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click('div[role="button"]'),
      ])

      // Click text="Delete"
      await page.click('text="Delete"')

      // Click input[type="text"]
      await page.click('input[type="text"]')

      // Fill input[type="text"]
      await page.fill('input[type="text"]', 'survey')

      // Click div[role="dialog"] >> text="Delete"
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/surveys/' } */),
        page.click('div[role="dialog"] >> text="Delete"'),
      ])

      await expect(page).toHaveText('Survey survey has been deleted')
    })
  })
