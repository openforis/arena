import { test } from '@playwright/test'

import { gotoEntities, gotoHome } from './_navigation'
import { TestId, getSelector } from '../../../webapp/utils/testId'

import { virtualEntities } from '../mock/nodeDefs'

export default () =>
  test.describe('Delete virtual entities', () => {
    gotoEntities()

    test(`Delete entity`, async () => {
      await Promise.all([page.waitForNavigation(), page.click(`text="${virtualEntities[0].name}"`)])

      await page.click(getSelector(TestId.nodeDefDetails.deleteBtn, 'button'))
      await Promise.all([page.waitForNavigation(), page.click(TestId.modal.ok)])
    })
    gotoHome()
  })
