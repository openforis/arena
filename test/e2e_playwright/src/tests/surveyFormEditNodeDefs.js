import { Selectors } from '../selectors'
// import { cluster } from '../mock/nodeDefs'

export default () =>
  describe('Survey Form Edit Cluster', () => {
    it('Root entity publish error', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      await page.hover('//div[3]')
      // Click text="Form Designer"
      await Promise.all([page.waitForNavigation(), page.click(Selectors.navigation.formDesigner)])

      await page.hover(Selectors.surveyForm.nodeDefErrorBadge('root_entity'))

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')

      await page.click(Selectors.header.publishBtn)
      await page.waitForTimeout(1000)
      await page.click('text="Ok"')

      await page.waitForTimeout(1000)

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')
    })
  })
