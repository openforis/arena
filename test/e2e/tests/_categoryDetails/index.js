import fs from 'fs'
import path from 'path'
import { downloadsPath } from '../../paths'
import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

const waitForApi = async (action) => Promise.all([page.waitForResponse('**/categories/**'), action])
const getItemCode = (codePrefix, itemIdx) => `${codePrefix}${itemIdx}`

export const editCategoryProps = (category) =>
  test(`Edit category ${category.label} props`, async () => {
    await waitForApi(page.fill(getSelector(DataTestId.categoryDetails.categoryName, 'input'), category.name))
  })

export const addLevels = (category) => {
  // add levels
  category.levels.forEach((level, idx) =>
    test(`Add level ${level.name}`, async () => {
      if (idx !== 0) {
        await waitForApi(page.click(getSelector(DataTestId.categoryDetails.addLevelBtn, 'button')))
      }
      await expect(page).toHaveSelector(getSelector(DataTestId.categoryDetails.level(idx)))
    })
  )
  // set level name (name of first level is visible only when there are multiple levels)
  if (category.levels.length > 1) {
    category.levels.forEach((level, idx) =>
      test(`Set level name for level ${idx}`, async () => {
        await waitForApi(page.fill(getSelector(DataTestId.categoryDetails.levelName(idx), 'input'), level.name))
      })
    )
  }
}

const addItem = (level, levelIdx, itemIdx, codePrefix) => {
  const itemCode = getItemCode(codePrefix, itemIdx)
  const itemLabel = `${level.name} ${itemCode}`

  test(`Add item ${level.name}->${itemCode}`, async () => {
    // add item
    await waitForApi(page.click(getSelector(DataTestId.categoryDetails.levelAddItemBtn(levelIdx), 'button')))

    const itemCodeSelector = getSelector(DataTestId.categoryDetails.itemCode(levelIdx, itemIdx), 'input')
    const itemLabelSelector = getSelector(DataTestId.categoryDetails.itemLabel(levelIdx, itemIdx)(), 'input')
    // fill code and label
    await waitForApi(page.fill(itemCodeSelector, itemCode))
    await waitForApi(page.fill(itemLabelSelector, itemLabel))
    // verify code and label
    const itemCodeEl = await page.$(itemCodeSelector)
    const itemLabelEl = await page.$(itemLabelSelector)
    await expect(await itemCodeEl.getAttribute('value')).toBe(itemCode)
    await expect(await itemLabelEl.getAttribute('value')).toBe(itemLabel)
    // close item editor
    await page.click(getSelector(DataTestId.categoryDetails.itemCloseBtn(levelIdx, itemIdx), 'button'))
  })
}

export const addItems = (category, levelIdx, codePrefix = '') => {
  const level = category.levels[levelIdx]
  const itemsIdx = Array.from(Array(level.codes).keys())

  itemsIdx.forEach((itemIdx) => {
    const itemCode = getItemCode(codePrefix, itemIdx)

    if (levelIdx === 0 && itemIdx === 0) {
      test(`Verify item ${level.name}->${itemCode} has error`, async () => {
        await page.hover(getSelector(DataTestId.categoryDetails.levelErrorBadge(levelIdx)))
        await expect(page).toHaveText('Define at least one item')
      })
    }

    addItem(level, levelIdx, itemIdx, codePrefix)
  })

  const levelIdxNext = levelIdx + 1
  if (category.levels[levelIdxNext]) {
    itemsIdx.forEach((itemIdx) => {
      test(`Select item ${level.name}->${getItemCode(codePrefix, itemIdx)}`, async () => {
        await waitForApi(page.click(getSelector(DataTestId.categoryDetails.item(levelIdx, itemIdx))))
      })
      addItems(category, levelIdxNext, `${codePrefix}${itemIdx}`)
    })
  }
}

export const exportCategory = (category) => {
  test(`Export category ${category.name}`, async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForResponse('**/export/**'),
      page.click(getSelector(DataTestId.categoryDetails.exportBtn, 'button')),
    ])
    const exportFilePath = path.resolve(downloadsPath, `category-${category.name}-export.zip`)

    await download.saveAs(exportFilePath)

    await expect(fs.existsSync(exportFilePath)).toBeTruthy()
  })
}
