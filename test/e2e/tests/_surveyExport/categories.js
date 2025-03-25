import * as PromiseUtils from '../../../../core/promiseUtils'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { categories, categoryItems } from '../../mock/categories'
import { getProps } from './_surveyUtils'

export const verifyCategories = (survey) =>
  test('Verify categories', async () => {
    const categoriesExport = Object.values(getSurveyEntry(survey, ExportFile.categories))
    await expect(categoriesExport.length).toBe(Object.values(categories).length)

    await PromiseUtils.each(categoriesExport, async (categoryExport) => {
      const category = categories[getProps(categoryExport).name]

      // verify levels
      await expect(Object.keys(categoryExport.levels).length).toBe(category.levels.length)
      await PromiseUtils.each(Object.entries(categoryExport.levels), async ([idx, levelExport]) => {
        await expect(getProps(levelExport).name).toBe(category.levels[Number(idx)].name)
      })

      // verify items count
      const itemsExport = getSurveyEntry(
        survey,
        ExportFile.categoryItemsSingleFile({ categoryUuid: categoryExport.uuid })
      )
      const items = categoryItems[category.name]
      await expect(itemsExport.length).toBe(items.length)

      // verify items value
      await PromiseUtils.each(itemsExport, async (itemExport) => {
        const item = items.find((_item) => _item.code === getProps(itemExport).code)
        await expect(getProps(itemExport).labels.en).toBe(item.label)
      })
    })
  })
