import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

export const editCategoryProps = (category) =>
  test(`Edit category ${category.label} props`, async () => {
    await page.fill(getSelector(DataTestId.categoryDetails.categoryName, 'input'), category.name)
  })

export const addLevels = (category) => {
  category.levels.forEach((level, idx) =>
    test(`Add level ${level.name}`, async () => {
      if (idx !== 0) {
        await page.click(getSelector(DataTestId.categoryDetails.addLevelBtn, 'button'))
      }
      await page.fill(getSelector(DataTestId.categoryDetails.levelName(idx), 'input'), level.name)
      await expect(page).toHaveSelector(getSelector(DataTestId.categoryDetails.level(idx)))
    })
  )
}

export const addItems = (category, levelIdx, codePrefix = '') => {
  const level = category.levels[levelIdx]
  const itemsIdx = Array.from(Array(level.codes).keys())

  itemsIdx.forEach((itemIdx) => {
    test(`Add item ${level.name}-${itemIdx}`, async () => {
      if (levelIdx === 0 && itemIdx === 0) {
        await page.hover(getSelector(DataTestId.categoryDetails.levelErrorBadge(levelIdx)))
        await expect(page).toHaveText('Define at least one item')
      }

      await page.click(getSelector(DataTestId.categoryDetails.levelItemAddBtn(levelIdx), 'button'))

      await page.hover(getSelector(DataTestId.categoryDetails.itemErrorBadge(levelIdx, itemIdx)))
      await expect(page).toHaveText('Code is required')

      await page.fill(
        getSelector(DataTestId.categoryDetails.itemCode(levelIdx, itemIdx), 'input'),
        `${codePrefix}${itemIdx}`
      )
      await page.fill(
        getSelector(DataTestId.categoryDetails.itemLabel(levelIdx, itemIdx)(), 'input'),
        `${level.name} ${codePrefix}${itemIdx}`
      )
    })
  })

  const levelIdxNext = levelIdx + 1
  const levelNext = category.levels[levelIdxNext]
  if (levelNext) {
    itemsIdx.forEach((itemIdx) => {
      test(`Select item ${level.idx}->${itemIdx}`, async () => {
        await page.click(getSelector(DataTestId.categoryDetails.item(levelIdx, itemIdx)))
      })
      addItems(category, levelIdxNext, `${codePrefix}${itemIdx}`)
    })
  }
}
