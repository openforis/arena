import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as ObjectUtils from '@core/objectUtils'

import Job from '@server/job/job'
import BatchPersister from '@server/db/batchPersister'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import * as XForm from '../model/xform'
import type { XFormBodyControl, ItextTranslations } from '../model/xform'

interface CategorySourceItem {
  code: string
  labels: Record<string, string>
}

interface CategorySource {
  key: string // 'instance:<id>' for a secondary-instance itemset, 'field:<path>' for inline <item> choices
  name: string
  items: CategorySourceItem[]
}

const sanitizeCategoryName = (rawName: string): string =>
  rawName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[^a-zA-Z_]/, '_$&')
    .toLowerCase() || 'choices'

/**
 * Inserts one Arena Category per distinct ODK choice list - either a secondary <instance id="...">
 * itemset (deduplicated by instance id, since several fields commonly share one list) or a select's
 * own inline <item> children. Cascading/filtered lists (`choice_filter`) are not detected here and
 * are imported as flat, single-level categories (see the design spec's "Scope" section).
 * Mirrors collectImport's CategoriesImportJob (same BatchPersister-batched item insert).
 */
export default class CategoriesImportJob extends Job {
  static readonly type = 'CategoriesImportJob'

  itemBatchPersister: BatchPersister

  constructor(params?: any) {
    super(CategoriesImportJob.type, params)
    this.itemBatchPersister = new BatchPersister(this.itemsInsertHandler.bind(this))
  }

  async execute() {
    const { tx } = this
    const context: any = this.context
    const { xform, survey, defaultLanguage } = context

    const bodyControlsByPath = XForm.buildBodyControlsByPath(xform)
    const secondaryInstances = XForm.getSecondaryInstancesByInstanceId(xform)
    const { translations } = XForm.getItextTranslations(xform)

    const sources = this._collectCategorySources({
      bodyControlsByPath,
      secondaryInstances,
      translations,
      defaultLanguage,
    })

    this.total = sources.length

    const categoriesByKey: Record<string, any> = {}
    const categories: any[] = []

    for (const source of sources) {
      if (this.isCanceled()) break

      const category = await this._insertCategory(source.name)
      await this._insertItems(category, source.items)
      categoriesByKey[source.key] = category
      categories.push(category)

      this.incrementProcessedItems()
    }

    await this.itemBatchPersister.flush(tx)

    const surveyUpdated = Survey.assocCategories(ObjectUtils.toUuidIndexedObj(categories))(survey)
    await CategoryManager.validateCategories(surveyUpdated, tx)

    this.setContext({ categoriesByKey, survey: surveyUpdated })
  }

  _collectCategorySources({
    bodyControlsByPath,
    secondaryInstances,
    translations,
    defaultLanguage,
  }: {
    bodyControlsByPath: Map<string, XFormBodyControl>
    secondaryInstances: Map<string, Array<{ name: string; labelRef: string | null; labelText: string | null }>>
    translations: ItextTranslations
    defaultLanguage: string
  }): CategorySource[] {
    const sources: CategorySource[] = []
    const seenInstanceIds = new Set<string>()
    const usedNames = new Set<string>()

    const uniqueName = (rawName: string): string => {
      const base = sanitizeCategoryName(rawName)
      let name = base
      let suffix = 1
      while (usedNames.has(name)) {
        suffix += 1
        name = `${base}_${suffix}`
      }
      usedNames.add(name)
      return name
    }

    for (const control of bodyControlsByPath.values()) {
      if (control.controlType !== 'select1' && control.controlType !== 'select') continue

      if (control.itemsetInstanceId) {
        if (seenInstanceIds.has(control.itemsetInstanceId)) continue
        seenInstanceIds.add(control.itemsetInstanceId)

        const instanceItems = secondaryInstances.get(control.itemsetInstanceId) ?? []
        sources.push({
          key: `instance:${control.itemsetInstanceId}`,
          name: uniqueName(control.itemsetInstanceId),
          items: instanceItems.map((item) => ({
            code: item.name,
            labels: XForm.resolveLabels({
              labelRef: item.labelRef,
              labelText: item.labelText,
              translations,
              defaultLanguage,
            }),
          })),
        })
      } else if (control.items.length > 0) {
        sources.push({
          key: `field:${control.path}`,
          name: uniqueName(control.path.split('/').pop() ?? control.path),
          items: control.items.map((item) => ({
            code: item.value,
            labels: XForm.resolveLabels({
              labelRef: item.labelRef,
              labelText: item.labelText,
              translations,
              defaultLanguage,
            }),
          })),
        })
      }
    }
    return sources
  }

  async _insertCategory(name: string) {
    const category = Category.newCategory({ [Category.keysProps.name]: name })
    return CategoryManager.insertCategory({ user: this.user, surveyId: this.surveyId, category, system: true }, this.tx)
  }

  async _insertItems(category: any, items: CategorySourceItem[]) {
    const categoryUuid = Category.getUuid(category)
    const level = Category.getLevelByIndex(0)(category)
    const levelUuid = CategoryLevel.getUuid(level)

    for (let index = 0; index < items.length; index += 1) {
      const { code, labels } = items[index]
      const item = {
        ...CategoryItem.newItem(levelUuid, null, {
          [CategoryItem.keysProps.code]: code,
          [CategoryItem.keysProps.labels]: labels,
          [CategoryItem.keysProps.index]: index,
        }),
        categoryUuid, // used to revalidate categories after items import, same as collectImport's CategoriesImportJob
      }
      await this.itemBatchPersister.addItem(item, this.tx)
    }
  }

  async itemsInsertHandler(items: any[], tx: any) {
    await CategoryManager.insertItems(this.user, this.surveyId, items, tx)
  }
}
