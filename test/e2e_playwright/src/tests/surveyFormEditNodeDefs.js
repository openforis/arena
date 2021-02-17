import { Selectors } from '../selectors'
import { cluster } from '../mock/nodeDefs'

const clusterAttributeKeys = Object.keys(cluster.children).filter((key) => cluster.children[key].type !== 'entity')

const editNodeDef = async (nodeDef) => {
  await page.fill(Selectors.nodeDefDetails.nodeDefName, nodeDef.name)
  await page.fill(Selectors.nodeDefDetails.nodeDefLabels(), nodeDef.label)
  if (nodeDef.key) await page.click(Selectors.nodeDefDetails.nodeDefKey)

  // Click text="Save"
  await Promise.all([page.waitForResponse('**/api/survey/**'), page.click(Selectors.nodeDefDetails.save)])
  // Click text="Back"
  await Promise.all([page.waitForNavigation(), page.click('text="Back"')])
  await expect(page.url()).toBe('http://localhost:9090/app/designer/formDesigner/')

  await expect(page).toHaveText(nodeDef.label)
}

export default () =>
  describe('Survey Form Edit Cluster', () => {
    it('Root entity publish error', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      await page.hover('//div[3]')
      // Click text="Form Designer"
      await Promise.all([page.waitForNavigation(), page.click(Selectors.sidebar.formDesigner)])
      expect(page.url()).toBe('http://localhost:9090/app/designer/formDesigner/')

      await page.hover(Selectors.surveyForm.nodeDefErrorBadge('root_entity'))

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')
    })

    it('Survey Publish with errors', async () => {
      await page.click(Selectors.header.publishBtn)
      await page.waitForSelector(Selectors.modal.modal)
      await page.click(Selectors.modal.ok)

      await page.waitForSelector(Selectors.modal.itemError)

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')
      await page.click(Selectors.modal.close)
    })

    it('Cluster edit', async () => {
      await Promise.all([page.waitForNavigation(), page.click(Selectors.surveyForm.nodeDefEditBtn('root_entity'))])
      await editNodeDef(cluster)
    })

    it.each(clusterAttributeKeys)('Cluster child %o edit', async (key) => {
      const child = cluster.children[key]
      await page.click(Selectors.surveyForm.nodeDefAddChildBtn(cluster.name))
      await page.click(`text="${child.type}"`)
      await editNodeDef(child)
    })

    it('Survey Publish without errors', async () => {
      await page.click(Selectors.header.publishBtn)
      await page.waitForSelector(Selectors.modal.modal)
      await page.click(Selectors.modal.ok)
      await page.click(Selectors.modal.close)
      await page.click(Selectors.sidebar.home)
      await expect(page).toHaveText('PUBLISHED')
    })
  })
