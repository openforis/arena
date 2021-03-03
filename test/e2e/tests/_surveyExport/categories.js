import * as PromiseUtils from '../../../../core/promiseUtils'
import { getSurveyEntry } from '../../downloads/path'
import { categories, categoryItems } from '../../mock/categories'

export const verifyCategories = (survey) =>
  test('Verify categories', async () => {
    const categoriesExport = Object.values(getSurveyEntry(survey, 'categories', 'categories.json'))
    await expect(categoriesExport.length).toBe(Object.values(categories).length)

    await PromiseUtils.each(categoriesExport, async (categoryExport) => {
      const category = categories[categoryExport.props.name]

      // verify levels
      await expect(Object.keys(categoryExport.levels).length).toBe(category.levels.length)
      await PromiseUtils.each(Object.entries(categoryExport.levels), async ([idx, levelExport]) => {
        await expect(levelExport.props.name).toBe(category.levels[Number(idx)].name)
      })

      // verify items count
      const itemsExport = getSurveyEntry(survey, 'categories', `${categoryExport.uuid}.json`)
      const items = categoryItems[category.name]
      await expect(itemsExport.length).toBe(items.length)

      // verify items value
      await PromiseUtils.each(itemsExport, async (itemExport) => {
        const item = items.find((_item) => _item.code === itemExport.props.code)
        await expect(itemExport.props.labels.en).toBe(item.label)
      })
    })
  })
