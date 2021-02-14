export default () =>
  describe('Survey Create', () => {
    it('Create Survey 1', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      // Click //span
      await page.click('//span')

      // Click text="My Surveys"
      await page.click('text="My Surveys"')
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveys/');

      // Click //span
      await page.click('//span')

      // Click text="Create Survey"
      await page.click('text="Create Survey"')
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveyNew/');

      // Click input[placeholder="Name"]
      await page.click('input[placeholder="Name"]')

      // Fill input[placeholder="Name"]
      await page.fill('input[placeholder="Name"]', 'survey')

      // Press Tab
      await page.press('input[placeholder="Name"]', 'Tab')

      // Fill input[placeholder="Label"]
      await page.fill('input[placeholder="Label"]', 'Survey')

      // Click text="Create Survey"
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click('text="Create Survey"'),
      ])

      await expect(page).toHaveText('Survey')
    })

    it('Create Survey 2', async () => {
      // Go to http://localhost:9090/app/home/
      await page.goto('http://localhost:9090/app/home/')

      // Click //div[1][normalize-space(.)='survey - SurveyPublish']/button/span
      await page.click("//div[1][normalize-space(.)='survey - SurveyPublish']/button/span")

      // Click text="Create Survey"
      await page.click('text="Create Survey"')
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveyNew/');

      // Click input[placeholder="Name"]
      await page.click('input[placeholder="Name"]')

      // Fill input[placeholder="Name"]
      await page.fill('input[placeholder="Name"]', 'survey_2')

      // Press Tab
      await page.press('input[placeholder="Name"]', 'Tab')

      // Fill input[placeholder="Label"]
      await page.fill('input[placeholder="Label"]', 'Survey 2')

      // Click text="Create Survey"
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click('text="Create Survey"'),
      ])
      await expect(page).toHaveText('Survey 2')
    })

    it('Select Survey 1', async () => {
      // Click //div[1][normalize-space(.)='survey_2 - Survey 2Publish']/button
      await page.click("//div[1][normalize-space(.)='survey_2 - Survey 2Publish']/button")

      // Click text="My Surveys"
      await page.click('text="My Surveys"')
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveys/');

      // Click //div[normalize-space(.)='surveyTesterSurveyA moment agoA moment agoDRAFT' and normalize-space(@role)='button']
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click(
          "//div[normalize-space(.)='surveyTesterSurveyA moment agoA moment agoDRAFT' and normalize-space(@role)='button']"
        ),
      ])

      await expect(page).toHaveText('Survey')
    })
  })
