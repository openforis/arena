import { gotoHome, gotoEntities } from './_navigation'
import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { virtualEntities } from '../mock/nodeDefs'

export default () =>
  describe('Create virtual entities', () => {
    gotoEntities()

    describe.each(Array.from(Array(virtualEntities.length).keys()))(`Add virtual entity %s`, (idx) => {
      const entity = virtualEntities[idx]

      test(`Create entity`, async () => {
        await Promise.all([page.waitForNavigation(), page.click(getSelector(DataTestId.entities.addBtn, 'button'))])

        await page.fill(getSelector(DataTestId.nodeDefDetails.nodeDefName, 'input'), entity.name)
        await page.fill(getSelector(DataTestId.nodeDefDetails.nodeDefLabels(), 'input'), entity.label)

        await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.entities.entitySelector), 'button'))
        await page.click(`text="Tree"`)

        // Save
        await Promise.all([
          page.waitForResponse('**/api/survey/**'),
          page.click(getSelector(DataTestId.nodeDefDetails.saveBtn, 'button')),
        ])
        // Back
        await Promise.all([
          page.waitForNavigation(),
          page.click(getSelector(DataTestId.nodeDefDetails.backBtn, 'button')),
        ])
      })
    })

    gotoHome()
  })
