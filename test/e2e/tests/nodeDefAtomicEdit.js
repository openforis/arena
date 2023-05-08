import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { editNodeDef, addNodeDef, addNodeDefAtomicChildren, addNodeDefSubPage } from './_formDesigner'
import { gotoFormDesigner } from './_navigation'
import { publishWithErrors, publishWithoutErrors } from './_publish'

export default () =>
  test.describe('NodeDef atomic edit', () => {
    gotoFormDesigner()

    test('Verify root entity error', async () => {
      await page.hover(getSelector(TestId.surveyForm.nodeDefErrorBadge('root_entity')))

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
