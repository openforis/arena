import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { gotoFormDesigner } from './_navigation'
import { editAtomicChildren, editNodeDef } from './_nodeDefDetails'
import { publishWithErrors, publishWithoutErrors } from './_publish'

export default () =>
  describe('NodeDef atomic edit', () => {
    gotoFormDesigner()

    test('Verify root entity error', async () => {
      await page.hover(getSelector(DataTestId.surveyForm.nodeDefErrorBadge('root_entity')))

      await expect(page).toHaveText('Define at least one key attribute')
      await expect(page).toHaveText('Define at least one child item')
    })

    publishWithErrors('Define at least one key attribute', 'Define at least one child item')

    // ====== cluster edit
    test('Cluster edit', async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click(getSelector(DataTestId.surveyForm.nodeDefEditBtn('root_entity'), 'a')),
      ])
      await editNodeDef(cluster)
    })

    editAtomicChildren(cluster)

    // ====== plot edit
    test('Plot edit', async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click(getSelector(DataTestId.surveyForm.addSubPageBtn, 'button')),
      ])
      await editNodeDef(plot)
    })

    editAtomicChildren(plot)

    // ====== tree edit
    test('Tree edit', async () => {
      await page.click(getSelector(DataTestId.surveyForm.nodeDefAddChildBtn(plot.name, 'button')))
      await Promise.all([page.waitForNavigation(), page.click(`text="${tree.type}"`)])
      await editNodeDef(tree)
    })

    editAtomicChildren(tree)

    publishWithoutErrors()
  })
