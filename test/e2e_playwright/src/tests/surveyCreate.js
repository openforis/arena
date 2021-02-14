import { Selectors } from '../selectors'

export default () =>
  describe('Survey Create', () => {
    it('Create Survey 1', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      // Click //span
      await page.click(Selectors.header.userBtn)

      // Click text="Create Survey"
      await page.click(Selectors.header.createSurvey)
      expect(page.url()).toBe('http://localhost:9090/app/home/surveyNew/')

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

      // Click user-btn
      await page.click('#user-btn')

      // Click text="Create Survey"
      await page.click(Selectors.header.createSurvey)
      // assert.equal(page.url(), 'http://localhost:9090/app/home/surveyNew/');

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
      // Click user-btn
      await page.click('#user-btn')

      // Click text="My Surveys"
      await page.click(Selectors.header.mySurveys)
      expect(page.url()).toBe('http://localhost:9090/app/home/surveys/')

      // Click [id="surveys_1"]
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click(Selectors.surveyList.surveyRow(1)),
      ])

      await expect(page).toHaveText('Survey')
    })
  })
