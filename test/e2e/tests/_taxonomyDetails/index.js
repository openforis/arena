import path from 'path'
import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'

const waitForApi = async (action) => Promise.all([page.waitForResponse('**/taxonomies/**'), action])

const getFileInput = async () => page.$(getSelector(TestId.taxonomyDetails.uploadInput), 'input')

const getFileName = (fileName) => path.resolve(__dirname, '..', '..', 'resources', fileName)

export const editTaxonomyDetails = (taxonomy) => {
  test(`Edit taxonomy ${taxonomy.name} details`, async () => {
    await waitForApi(FormUtils.fillInput(TestId.taxonomyDetails.taxonomyName, taxonomy.name))
    await waitForApi(FormUtils.fillInput(TestId.taxonomyDetails.taxonomyDescription(), taxonomy.description))
  })

  test(`Upload taxonomy ${taxonomy.name} invalid CSV`, async () => {
    const fileInput = await getFileInput()
    const fileName = getFileName(`${taxonomy.name}_invalid.csv`)
    await fileInput.setInputFiles(fileName)
    // wait for job to complete
    await page.waitForTimeout(3000)
    await expect(page).toHaveText('Duplicate code')
    await page.click(TestId.modal.close)
  })

  test(`Upload taxonomy ${taxonomy.name} valid CSV`, async () => {
    const fileInput = await getFileInput()
    const fileName = getFileName(`${taxonomy.name}.csv`)
    await fileInput.setInputFiles(fileName)
    // wait for job to complete
    await page.waitForTimeout(3000)
    await page.click(TestId.modal.close)
  })
}
