import { gotoHome, gotoEntities } from './_navigation'
import { TestId, getSelector } from '../../../webapp/utils/testId'
import { virtualEntities } from '../mock/nodeDefs'
import { FormUtils } from './utils/formUtils'

export default () =>
  describe('Create virtual entities', () => {
    gotoEntities()

    describe.each(Array.from(Array(virtualEntities.length).keys()))(`Add virtual entity %s`, (idx) => {
      const entity = virtualEntities[idx]

      test(`Create entity`, async () => {
        await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.entities.addBtn, 'button'))])

        await page.fill(getSelector(TestId.nodeDefDetails.nodeDefName, 'input'), entity.name)
        await page.fill(getSelector(TestId.nodeDefDetails.nodeDefLabels(), 'input'), entity.label)

        await FormUtils.selectDropdownItem({ testId: TestId.entities.entitySelector, label: 'Tree' })

        // Save
        await Promise.all([
          page.waitForResponse('**/api/survey/**'),
          page.click(getSelector(TestId.nodeDefDetails.saveBtn, 'button')),
        ])
        // Back
        await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.nodeDefDetails.backBtn, 'button'))])
      })
    })

    gotoHome()
  })
