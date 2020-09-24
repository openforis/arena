import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

import { click, expectToBe, toRightOf } from '../utils/api'

import {
  addCategoryLevel,
  addCategoryItem,
  updateCategoryLevelName,
  waitForLoader,
  clickSidebarBtnDesignerCategories,
  clickCategoryButtonDone,
  clickCategoryItem,
  clickCategoryItemBtnClose,
} from '../utils/ui'

const levelNames = {
  0: 'country',
  1: 'region',
  2: 'district',
}
const itemsPerLevel = 5

const _expectItemsInLevel = async ({ levelIndex, numberOfItems }) =>
  expectToBe({
    selector: `.category__level-${levelIndex} .category__item`,
    numberOfItems,
  })

const _getItemCode = ({ index, codeParent = '' }) => codeParent + StringUtils.padStart(2, '0')(String(index + 1))

const _createItems = ({ levelIndex, codeParent = '' }) =>
  new Array(itemsPerLevel).fill().map((_, index) => {
    const code = _getItemCode({ index, codeParent })
    return { code, label: `${levelNames[levelIndex]} ${code}` }
  })

const _addChildrenItems = async ({ codeParent, levelIndex }) => {
  const itemsChildren = _createItems({
    codeParent,
    levelIndex,
  })
  await PromiseUtils.each(itemsChildren, async (itemChild, itemIndex) =>
    addCategoryItem({
      levelIndex,
      itemIndex,
      code: itemChild.code,
      label: itemChild.label,
    })
  )
  await _expectItemsInLevel({ levelIndex, numberOfItems: itemsPerLevel })
}

describe('Categories: edit category', () => {
  test('Add levels', async () => {
    await waitForLoader()
    await clickSidebarBtnDesignerCategories()
    await click('edit', toRightOf('administrative_unit'))

    // start of category edit
    await updateCategoryLevelName({ levelIndex: 0, name: levelNames[0] })
    await addCategoryLevel({ levelIndex: 1, name: levelNames[1] })
    await addCategoryLevel({ levelIndex: 2, name: levelNames[2] })

    await expectToBe({ selector: '.category__level', numberOfItems: 3 })
  })

  test('Add items (1st and 2nd level)', async () => {
    const itemLevel1 = { code: '00', label: 'Country' }
    await addCategoryItem({ levelIndex: 0, itemIndex: 0, code: itemLevel1.code, label: itemLevel1.label })

    await expectToBe({ selector: '.category__item', numberOfItems: 1 })

    await _addChildrenItems({ levelIndex: 1 })

    await clickCategoryItemBtnClose({ levelIndex: 0, itemIndex: 0 })
  })

  test(
    'Add items (3rd level)',
    async () => {
      const itemsParent = _createItems({
        codeParent: '',
        levelIndex: 1,
      })
      await PromiseUtils.each(itemsParent, async (itemParent, indexParent) => {
        await clickCategoryItem({ levelIndex: 1, itemIndex: indexParent })
        await _addChildrenItems({ codeParent: itemParent.code, levelIndex: 2 })
      })
    },
    1000 * 5 * itemsPerLevel ** 2 /* 5 sec x item */
  )

  test('Select items', async () => {
    await clickCategoryItem({ levelIndex: 0, itemIndex: 0 })

    // click 1st level item
    await clickCategoryItem({ levelIndex: 0, itemIndex: 0 })
    await expectToBe({ selector: '.category__item', numberOfItems: 1 + itemsPerLevel })

    // click 2nd level item (1)
    await clickCategoryItem({ levelIndex: 1, itemIndex: 0 })
    await expectToBe({ selector: '.category__item', numberOfItems: 1 + itemsPerLevel * 2 })

    // click 2nd level item (2)
    await clickCategoryItem({ levelIndex: 1, itemIndex: 1 })
    await expectToBe({ selector: '.category__item', numberOfItems: 1 + itemsPerLevel * 2 })

    // click 3nd level item
    await clickCategoryItem({ levelIndex: 2, itemIndex: 0 })
    await expectToBe({ selector: '.category__item', numberOfItems: 1 + itemsPerLevel * 2 })

    await clickCategoryButtonDone()
  })
})
