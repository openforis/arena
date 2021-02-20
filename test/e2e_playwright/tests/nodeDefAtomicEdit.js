import { DataTestId } from '../../../webapp/utils/dataTestId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { editAtomicChildren, editNodeDef } from './_nodeDefDetails'
import { publishWithErrors, publishWithoutErrors } from './_publish'

export default () =>
  describe('NodeDef atomic edit', () => {
    test('Verify root entity error', async () => {
      // Go to http://localhost:9090/app/home/dashboard/
      await page.goto('http://localhost:9090/app/home/dashboard/')

      await page.hover(DataTestId.getSelector(DataTestId.sidebar.module('designer')))
      // Click text="Form Designer"
      await Promise.all([
        page.waitForNavigation(),
        page.click(DataTestId.getSelector(DataTestId.sidebar.moduleBtn('formDesigner'), 'a')),
      ])
      expect(page.url()).toBe('http://localhost:9090/app/designer/formDesigner/')

      await page.hover(DataTestId.surveyForm.nodeDefErrorBadge('root_entity'))

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')
    })

    publishWithErrors('Define at least one key attribute', 'Define at least one child item')

    // ====== cluster edit
    test('Cluster edit', async () => {
      await Promise.all([page.waitForNavigation(), page.click(DataTestId.surveyForm.nodeDefEditBtn('root_entity'))])
      await editNodeDef(cluster)
    })
    editAtomicChildren(cluster)

    // ====== plot edit
    test('Plot edit', async () => {
      await Promise.all([page.waitForNavigation(), page.click(DataTestId.surveyForm.addSubPageBtn)])
      await editNodeDef(plot)
    })
    editAtomicChildren(plot)

    // ====== tree edit
    test('Tree edit', async () => {
      await page.click(DataTestId.surveyForm.nodeDefAddChildBtn(plot.name))
      await Promise.all([page.waitForNavigation(), page.click(`text="${tree.type}"`)])
      await editNodeDef(tree)
    })
    editAtomicChildren(tree)

    publishWithoutErrors()
  })
