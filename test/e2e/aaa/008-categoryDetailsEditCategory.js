import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

import { click, expectExists, expectToBe, toRightOf } from '../utils/api'

import {
  addCategoryItem,
  addCategoryLevel,
  clickCategoryButtonDone,
  clickCategoryItem,
  clickCategoryItemBtnClose,
  updateCategoryLevelName,
  expectCategoryItemsInLevel,
  expectCategoryItemsInLevelEmpty,
} from '../utils/ui/categoryDetails'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnDesignerCategories } from '../utils/ui/sidebar'

const categoryName = 'administrative_unit'
const levels = ['country', 'region', 'district']
const itemsPerLevel = 5
const itemInsertTime = 7 * 1000 // 7 sec

const _getItemCode = ({ index, codePrefix = '' }) => codePrefix + StringUtils.padStart(2, '0')(String(index + 1))

const _createItems = ({ levelIndex, codePrefix = '' }) =>
  new Array(itemsPerLevel).fill().map((_, index) => {
    const code = _getItemCode({ index, codePrefix })
    const label = StringUtils.capitalizeFirstLetter(`${levels[levelIndex]} ${code}`)
    return { code, label }
  })

const _addChildItems = async ({ codePrefix, levelIndex }) => {
  const itemsChildren = _createItems({ codePrefix, levelIndex })

  await PromiseUtils.each(itemsChildren, async (itemChild, itemIndex) =>
    addCategoryItem({
      levelIndex,
      itemIndex,
      code: itemChild.code,
      label: itemChild.label,
    })
  )

  await expectCategoryItemsInLevel({ levelIndex, numberOfItems: itemsPerLevel })
}

const addCategoryChildItems = async ({ itemParent, indexParent }) => {
  await clickCategoryItem({ levelIndex: 1, itemIndex: indexParent })
  await _addChildItems({ codePrefix: itemParent.code, levelIndex: 2 })
}

describe('Categories: edit existing category', () => {
  test('CategoryList: navigate to categories', async () => {
    await waitForLoader()
    await clickSidebarBtnDesignerCategories()
    // Expect ${categoryName} to be invalid
    await expectExists({ text: 'Invalid', relativeSelectors: [toRightOf(categoryName)] })
  })

  test('CategoryDetails: add levels', async () => {
    await click('edit', toRightOf(categoryName))

    // start of category edit
    await updateCategoryLevelName({ levelIndex: 0, name: levels[0] })
    await addCategoryLevel({ levelIndex: 1, name: levels[1] })
    await addCategoryLevel({ levelIndex: 2, name: levels[2] })

    await expectToBe({ selector: '.category__level', numberOfItems: 3 })
  })

  test(
    'CategoryDetails: add items in 1st and 2nd level',
    async () => {
      const itemLevel1 = { code: '00', label: 'Country' }
      await addCategoryItem({ levelIndex: 0, itemIndex: 0, code: itemLevel1.code, label: itemLevel1.label })

      await expectCategoryItemsInLevel({ levelIndex: 0, numberOfItems: 1 })

      await _addChildItems({ levelIndex: 1 })
    },
    itemInsertTime * (1 + itemsPerLevel) + 2500
  )

  test(
    'CategoryDetails: add items in 3rd level',
    async () => {
      const itemsParent = _createItems({ levelIndex: 1 })

      await PromiseUtils.each(itemsParent, async (itemParent, indexParent) =>
        addCategoryChildItems({ itemParent, indexParent })
      )
    },
    itemInsertTime * itemsPerLevel ** 2 + 2500
  )

  test('CategoryDetails: select items', async () => {
    // close item in first level: no items in descendant levels expected
    await clickCategoryItemBtnClose({ levelIndex: 0, itemIndex: 0 })
    await expectCategoryItemsInLevelEmpty({ levelIndex: 1 })
    await expectCategoryItemsInLevelEmpty({ levelIndex: 2 })

    // click 1st level item
    await clickCategoryItem({ levelIndex: 0, itemIndex: 0 })
    await expectCategoryItemsInLevel({ levelIndex: 1, numberOfItems: itemsPerLevel })
    await expectExists({ text: 'Region 01' })
    await expectExists({ text: 'Region 05' })

    // click 2nd level item (1)
    await clickCategoryItem({ levelIndex: 1, itemIndex: 0 })
    await expectCategoryItemsInLevel({ levelIndex: 2, numberOfItems: itemsPerLevel })
    await expectExists({ text: 'District 0101' })
    await expectExists({ text: 'District 0102' })

    // click 2nd level item (2)
    await clickCategoryItem({ levelIndex: 1, itemIndex: 1 })
    await expectCategoryItemsInLevel({ levelIndex: 2, numberOfItems: itemsPerLevel })
    await expectExists({ text: 'District 0201' })
    await expectExists({ text: 'District 0202' })

    await clickCategoryButtonDone()
  })
})
