import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

import BatchPersister from '@server/db/batchPersister'
import * as CategoryManager from '../manager/categoryManager'
import { Objects } from '@openforis/arena-core'

export default class CategoryItemsUpdater {
  constructor({ surveyId, category, user, tx, errorHandler, itemExtraPropsExtrator }) {
    this.surveyId = surveyId
    this.category = category
    this.user = user
    /**
     * DB transaction
     */
    this.tx = tx
    this.errorHandler = errorHandler
    this.itemExtraPropsExtrator = itemExtraPropsExtrator

    /**
     * Processed category items indexed by ancestor codes + code (as a string)
     */
    this.itemsCacheByCodes = {}

    this.itemsBatchInserter = new BatchPersister(async (items) =>
      CategoryManager.insertItems(this.user, this.surveyId, items, this.tx)
    )
    this.itemsBatchUpdater = new BatchPersister(async (items) =>
      CategoryManager.updateItemsProps(this.user, this.surveyId, Category.getUuid(this.category), items, this.tx)
    )

    // only when updating a published category
    this.existingItems = []
    this.existingItemsProcessedByUuid = {}
  }

  async init() {
    if (Category.isPublished(this.category)) {
      // 2.a. fetch existing items (only for puslished category update)
      this.existingItems = await CategoryManager.fetchItemsByCategoryUuid(
        { surveyId: this.surveyId, categoryUuid: Category.getUuid(this.category), draft: true },
        this.tx
      )
    }
  }

  async insertOrUpdateItem({ itemCodes, level, placeholder, labelsByLang, descriptionsByLang, extra }) {
    const { category } = this

    const itemCached = this.getItemCachedByCodes(itemCodes)

    let item = null

    const code = itemCodes[itemCodes.length - 1]

    const itemProps = {
      [CategoryItem.keysProps.code]: code,
    }
    ObjectUtils.setInPath([CategoryItem.keysProps.labels], labelsByLang, false)(itemProps)
    ObjectUtils.setInPath([CategoryItem.keysProps.descriptions], descriptionsByLang, false)(itemProps)
    if (!placeholder) {
      ObjectUtils.setInPath([CategoryItem.keysProps.extra], this.itemExtraPropsExtrator(extra), false)(itemProps)
    }

    if (itemCached) {
      // Update existing item if extra props are changed
      item = {
        ...itemCached,
        // Override already inserted item props
        [CategoryItem.keys.props]: itemProps,
      }
      if (!Objects.isEqual(itemCached, item)) {
        // Update already inserted item (only extra props)
        await this.itemsBatchUpdater.addItem(item)
      }
    } else {
      const parentItemUuid = this._getParentItemUuid(itemCodes)

      if (Category.isPublished(category)) {
        const existingItem = this.existingItems.find(
          (existingItem) =>
            CategoryItem.getParentUuid(existingItem) === parentItemUuid && CategoryItem.getCode(existingItem) === code
        )
        if (existingItem) {
          const itemUuid = CategoryItem.getUuid(existingItem)
          if (!Objects.isEqual(itemProps, CategoryItem.getProps(existingItem))) {
            item = { uuid: itemUuid, props: itemProps }
            await this.itemsBatchUpdater.addItem(item)
          } else {
            item = existingItem
          }
          this.existingItemsProcessedByUuid[itemUuid] = true
        } else {
          item = await this._insertNewItem({ level, parentItemUuid, itemProps })
        }
      } else {
        // when category is not published, always insert new items (old items deleted previously)
        item = await this._insertNewItem({ level, parentItemUuid, itemProps })
      }
    }

    item.placeholder = placeholder
    this._putItemIntoCache(itemCodes, item)

    return {
      item,
      inserted: !itemCached,
    }
  }

  async flush() {
    if (!(await this._deleteNotProcessedDraftItems())) {
      return false
    }
    await this.itemsBatchInserter.flush()
    await this.itemsBatchUpdater.flush()
    return true
  }

  async _deleteNotProcessedDraftItems() {
    const { category } = this

    if (!Category.isPublished(category)) {
      // items already deleted before inserting new ones
      return true
    }

    const existingItemsNotProcessed = this.existingItems.filter(
      (existingItem) => !this.existingItemsProcessedByUuid[CategoryItem.getUuid(existingItem)]
    )

    // check that there are no published items that have not been processed
    const publishedItemsNotProcessed = existingItemsNotProcessed.filter(CategoryItem.isPublished)
    if (publishedItemsNotProcessed.length > 0) {
      const deletedItemCodes = publishedItemsNotProcessed.flatMap(CategoryItem.getCode)
      this.errorHandler(Validation.messageKeys.categoryImport.cannotDeleteItemsOfPublishedCategory, {
        deletedItemCodes,
      })
      return false
    }

    // not published items can be deleted safely
    const draftItemsNotProcessed = existingItemsNotProcessed.filter((item) => !CategoryItem.isPublished(item))
    if (draftItemsNotProcessed.length > 0) {
      await CategoryManager.deleteItems(
        {
          user: this.user,
          surveyId: this.surveyId,
          categoryUuid: Category.getUuid(this.category),
          items: draftItemsNotProcessed,
        },
        this.tx
      )
    }

    return true
  }

  async _insertNewItem({ level, parentItemUuid, itemProps }) {
    const item = CategoryItem.newItem(CategoryLevel.getUuid(level), parentItemUuid, itemProps)
    await this.itemsBatchInserter.addItem(item)
    return item
  }

  getItemCachedByCodes(itemCodes) {
    return this.itemsCacheByCodes[String(itemCodes)]
  }

  _putItemIntoCache(itemCodes, item) {
    // eslint-disable-next-line no-unused-vars
    const { props, ...itemWithoutProps } = item
    this.itemsCacheByCodes[String(itemCodes)] = itemWithoutProps // store item without props in cache to save memory
  }

  _getParentItemUuid(itemCodes) {
    if (itemCodes.length > 1) {
      const parentItemCodes = itemCodes.slice(0, itemCodes.length - 1)
      const itemParent = this.getItemCachedByCodes(parentItemCodes)
      if (itemParent) {
        return CategoryItem.getUuid(itemParent)
      } else {
        this.errorHandler(Validation.messageKeys.categoryImport.invalidParentItemOrder, {
          parentItemCodes: String(parentItemCodes),
        })
      }
    }

    return null
  }
}
