import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { gotoFormDesigner } from './_navigation'
import { publishWithErrors, publishWithoutErrors } from './_publish'
import { editNodeDef, addNodeDef, addNodeDefAtomicChildren, addNodeDefSubPage } from './_surveyForm'

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
    editNodeDef('root_entity', cluster)
    addNodeDefAtomicChildren(cluster)

    // ====== plot edit
    addNodeDefSubPage(cluster, plot)
    addNodeDefAtomicChildren(plot)

    // ====== tree edit
    addNodeDef(plot, tree)
    addNodeDefAtomicChildren(tree)

    publishWithoutErrors()
  })
