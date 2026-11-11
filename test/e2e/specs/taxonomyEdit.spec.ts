import path from 'node:path'

import { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { taxonomy } from '../fixtures/seed/sampleSurveyModel'
import { FormDesigner } from '../helpers/formDesigner'
import { publishSurvey, waitForJobEnd } from '../helpers/publish'
import { exportSurvey, verifySampleTaxonomies } from '../helpers/surveyExport'

const resourcePath = (fileName: string) => path.resolve(__dirname, '..', 'resources', fileName)

/**
 * Fills the specified taxonomy editor field and waits for the change to be saved.
 * @param {Page} page - The page.
 * @param {string} selector - Field selector.
 * @param {string} value - Value to fill.
 * @returns {Promise<void>} - Resolves when the change has been saved.
 */
const fillAndWait = async (page: Page, selector: string, value: string): Promise<void> => {
  await Promise.all([
    page.waitForResponse((response) => /\/taxonomies\//.test(response.url()) && response.request().method() === 'PUT'),
    page.locator(selector).fill(value),
  ])
}

const uploadTaxa = async (page: Page, fileName: string): Promise<string> => {
  await page.getByTestId(TestId.taxonomyDetails.uploadInput).setInputFiles(resourcePath(fileName))
  return waitForJobEnd(page)
}

test.describe('Taxonomy edit', () => {
  // long UI flow (many node defs edited and saved one by one)
  test.slow()

  test('creates a taxonomy from a taxon attribute and imports its taxa from CSV', async ({
    page,
    survey: _,
  }, testInfo) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    await designer.edit('root_entity')
    await designer.fillDetails({ name: 'cluster', label: 'Cluster' })
    await designer.saveAndBack('Cluster')
    await designer.addChildWithDetails('cluster', 'integer', { name: 'cluster_id', label: 'Cluster id', key: true })

    await designer.addChild('cluster', 'taxon')
    await designer.fillDetails({ name: 'species', label: 'Species' })

    await page.getByTestId(TestId.nodeDefDetails.taxonomySelectorAddBtn).click()
    await fillAndWait(page, `input[data-testid="${TestId.taxonomyDetails.taxonomyName}"]`, taxonomy.name)
    await fillAndWait(
      page,
      `input[data-testid="${TestId.taxonomyDetails.taxonomyDescription()}"], textarea[data-testid="${TestId.taxonomyDetails.taxonomyDescription()}"]`,
      taxonomy.description
    )

    // invalid file: duplicate codes
    expect(await uploadTaxa(page, `${taxonomy.name}_invalid.csv`)).toBe('failed')
    const jobModal = page.getByTestId(TestId.modal.modal)
    await expect(jobModal.getByText('Duplicate code').filter({ visible: true }).first()).toBeVisible()
    await jobModal.getByRole('button', { name: 'Close' }).click()

    // valid file
    expect(await uploadTaxa(page, `${taxonomy.name}.csv`)).toBe('succeeded')
    await jobModal.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByText('Afzelia quanzensis')).toBeVisible()

    await page.getByTestId(TestId.panelRight.closeBtn).click()
    await expect(page.getByText('Taxonomy', { exact: true }).first()).toBeVisible()
    await designer.saveAndBack('Species')

    await publishSurvey(page)

    const surveyExport = await exportSurvey(page, testInfo, { withData: false })
    verifySampleTaxonomies(surveyExport)
    const taxonomyUuid = (Object.values(surveyExport.entry('taxonomies/taxonomies.json'))[0] as any).uuid
    expect(surveyExport.nodeDefByName('species').props.taxonomyUuid).toBe(taxonomyUuid)
  })
})
