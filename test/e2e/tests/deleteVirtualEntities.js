import { gotoEntities, gotoHome } from './_navigation'
import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { virtualEntities } from '../mock/nodeDefs'
import { BASE_URL } from '../config'

export default () =>
  describe('Delete virtual entities', () => {
    gotoEntities()

    test(`Delete entity`, async () => {
      await Promise.all([page.waitForNavigation(), page.click(`text="${virtualEntities[0].name}"`)])

      await page.click(getSelector(DataTestId.nodeDefDetails.deleteBtn, 'button'))
      await Promise.all([page.waitForNavigation(), page.click(DataTestId.modal.ok)])
      await expect(page.url()).toBe(`${BASE_URL}/app/analysis/virtual-entities/`)
    })
    gotoHome()
  })
