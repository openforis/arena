import * as CategoryItem from '@core/survey/categoryItem'
import { ArrayUtils } from '@core/arrayUtils'

import Job from '@server/job/job'
import * as CategoryService from '@server/modules/category/service/categoryService'

import { ExportFile } from '../exportFile'

const itemsBatchSize = 10000

export default class CategoriesExportJob extends Job {
  constructor(params) {
    super('CategoriesExportJob', params)
  }

  async execute() {
    const { archive, backup, surveyId } = this.context

    // categories.json: list of all categories with levels
    const categoriesPathFile = ExportFile.categories
    const draft = true // always include draft categories
    const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({ surveyId, backup, draft }, this.tx)

    archive.append(JSON.stringify(categories, null, 2), { name: categoriesPathFile })

    // for each category create a  `${categoryUuid}.json` file with the category items
    const categoriesUuids = Object.keys(categories || {})
    this.total = categoriesUuids.length

    const itemsCountByCategoryUuid = await CategoryService.fetchItemsCountIndexedByCategoryUuid(
      { surveyId, draft },
      this.ts
    )

    for (const categoryUuid of categoriesUuids) {
      const itemsCount = itemsCountByCategoryUuid[categoryUuid]
      const totalPages = Math.ceil(itemsCount / itemsBatchSize)
      const pageIndexes = ArrayUtils.fromNumberOfElements(totalPages)
      // avoid exporting items with same UUID (see PR #4134)
      const exportedItemUuids = new Set()

      for (const pageIndex of pageIndexes) {
        const offset = pageIndex * itemsBatchSize
        const itemsData = await CategoryService.fetchItemsByCategoryUuid(
          { surveyId, categoryUuid, backup, draft, offset, limit: itemsBatchSize },
          this.tx
        )
        const itemsToExport = []
        for (const item of itemsData) {
          const itemUuid = CategoryItem.getUuid(item)
          if (exportedItemUuids.has(itemUuid)) {
            this.logDebug(`Item with uuid ${itemUuid} already exported for category ${categoryUuid}, skipping it`)
          } else {
            exportedItemUuids.add(itemUuid)
            itemsToExport.push(item)
          }
        }
        const fileName =
          totalPages === 1
            ? ExportFile.categoryItemsSingleFile({ categoryUuid })
            : ExportFile.categoryItemsPart({ categoryUuid, index: pageIndex })
        archive.append(JSON.stringify(itemsToExport), { name: fileName })
      }

      this.incrementProcessedItems()
    }
  }
}
