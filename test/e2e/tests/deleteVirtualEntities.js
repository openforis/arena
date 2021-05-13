import { gotoEntities, gotoHome } from './_navigation'
import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { virtualEntities } from '../mock/nodeDefs'

export default () =>
  describe('Delete virtual entities', () => {
    gotoEntities()

    test(`Delete entity`, async () => {
      await Promise.all([page.waitForNavigation(), page.click(`text="${virtualEntities[0].name}"`)])

      await page.click(getSelector(DataTestId.nodeDefDetails.deleteBtn, 'button'))
      await Promise.all([page.waitForNavigation(), page.click(DataTestId.modal.ok)])
    })
    gotoHome()
  })
