import { expect, test } from '../fixtures'
import { cluster, plot } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

test.describe('Survey hierarchy', () => {
  test('opens the hierarchy tree and expands the root entity', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.surveyHierarchy)

    const tree = page.locator('.survey-hierarchy__tree')
    const nodeLabels = tree.locator('.node-label')
    await expect(nodeLabels.filter({ hasText: cluster.label })).toBeVisible()
    await expect(page.getByText('Something went wrong')).toHaveCount(0)

    // the tree starts collapsed: expanding the root entity shows its child entity (animated with d3 transitions)
    await tree.locator('.node-grid', { hasText: cluster.label }).getByTitle('Expand / Collapse').click()
    await expect(nodeLabels.filter({ hasText: plot.label })).toBeVisible()
  })
})
