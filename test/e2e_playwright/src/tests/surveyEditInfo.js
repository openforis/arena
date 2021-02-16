import { Selectors } from '../selectors'

export default () =>
  describe('Survey Edit info', () => {
    it('Edit name required', async () => {
      await page.goto('http://localhost:9090/app/home/dashboard/')

      await page.click(Selectors.dashboard.editInfo)
      expect(page.url()).toBe('http://localhost:9090/app/home/surveyInfo/')

      // Fill input[type="text"]
      await page.fill('input[id="survey-name"]', '')

      // Click text="Save"
      await page.click('text="Save"')

      await page.hover('input[id="survey-name"]')
      await expect(page).toHaveText('Name is required')
    })

    it('Edit info', async () => {
      // Fill input[type="text"]
      await page.fill('input[id="survey-name"]', 'survey')
      await page.fill('input[id="survey-label-en"]', 'My Survey')
      await page.fill('input[id="survey-description-en"]', 'This is a survey description')
      await page.fill('input[id="survey-language"]', 'fr')
      // Click //div[normalize-space(.)='French' and normalize-space(@role)='button']
      await page.click("//div[normalize-space(.)='French' and normalize-space(@role)='button']")
      // Click text="Save"
      await page.click('text="Save"')

      // Click a[id="sidebar_btn_home"]
      await page.click(Selectors.sidebar.home)
      expect(page.url()).toBe('http://localhost:9090/app/home/dashboard/')

      // Click text="Edit info"
      await page.click(Selectors.dashboard.editInfo)
      expect(page.url()).toBe('http://localhost:9090/app/home/surveyInfo/')

      await expect(await page.getAttribute('input[id="survey-name"]', 'value')).toBe('survey')
      await expect(await page.getAttribute('input[id="survey-label-en"]', 'value')).toBe('My Survey')
      await expect(await page.getAttribute('input[id="survey-description-en"]', 'value')).toBe(
        'This is a survey description'
      )
      await expect(page).toHaveText('English')
      await expect(page).toHaveText('French')
    })
  })
