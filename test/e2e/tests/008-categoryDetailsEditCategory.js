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

const itemsPerLevel = 10
const itemsTotal = 1 + itemsPerLevel + itemsPerLevel ** 2

describe('Categories: edit category', () => {
  test('Add levels', async () => {
    await waitForLoader()
    await clickSidebarBtnDesignerCategories()
    await click('edit', toRightOf('administrative_unit'))

    // start of category edit
    await updateCategoryLevelName({ levelIndex: 0, name: 'country' })
    await addCategoryLevel({ levelIndex: 1, name: 'region' })
    await addCategoryLevel({ levelIndex: 2, name: 'district' })

    await expectToBe({ selector: '.category__level', numberOfItems: 3 })
  })

  test(
    'Add items',
    async () => {
      const labelPrefixByLevelIndex = {
        0: 'Country',
        1: 'Region',
        2: 'District',
      }

      const _createItems = ({ codePrefix = '', labelPrefix }) =>
        new Array(itemsPerLevel).fill().map((_, index) => {
          const code = codePrefix + StringUtils.padStart(2, '0')(String(index + 1))
          return { code, label: `${labelPrefix} ${code}` }
        })

      const _addChildrenItems = async ({ codePrefix, levelIndexParent }) => {
        const levelIndexChild = levelIndexParent + 1
        const itemsChildren = _createItems({
          codePrefix,
          labelPrefix: labelPrefixByLevelIndex[levelIndexChild],
        })
        await PromiseUtils.each(itemsChildren, async (itemChild, itemIndex) => {
          await addCategoryItem({
            levelIndex: levelIndexChild,
            itemIndex,
            code: itemChild.code,
            label: itemChild.label,
          })
          if (levelIndexChild < 2) {
            await _addChildrenItems({ codePrefix: itemChild.code, levelIndexParent: levelIndexChild })
          }
        })
        await expectToBe({
          selector: `.category__level-${levelIndexChild} .category__item`,
          numberOfItems: itemsPerLevel,
        })
      }

      const itemLevel1 = { code: '00', label: 'Country' }
      await addCategoryItem({ levelIndex: 0, itemIndex: 0, code: itemLevel1.code, label: itemLevel1.label })

      await expectToBe({ selector: '.category__item', numberOfItems: 1 })

      await _addChildrenItems({ codePrefix: '', levelIndexParent: 0 })

      await clickCategoryItemBtnClose({ levelIndex: 0, itemIndex: 0 })
    },
    1000 * 5 * itemsTotal /* 5 sec x item */
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
