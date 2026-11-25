import type { Router } from 'express'

import type { ArenaCategoryItem, ArenaTaxon } from '@openforis/arena-core'

import * as A from '@core/arena'
import { contains, isBlank } from '@core/stringUtils'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'
import SystemError from '@core/systemError'
import * as Request from '@server/utils/request'
import * as CategoryManager from '../../category/manager/categoryManager'
import * as TaxonomyManager from '../../taxonomy/manager/taxonomyManager'

type LiteralItem = { value: string; label: string }

const toItem =
  (type: string, lang: string | null = null) =>
  (item: ArenaCategoryItem | ArenaTaxon | null): LiteralItem | null => {
    if (!item) return null
    if (type === NodeDef.nodeDefType.code) {
      const categoryItem = item as ArenaCategoryItem
      return { value: CategoryItem.getCode(categoryItem), label: CategoryItem.getLabel(lang)(categoryItem) }
    }
    const taxon = item as ArenaTaxon
    return { value: Taxon.getCode(taxon), label: `(${Taxon.getCode(taxon)}) ${Taxon.getScientificName(taxon)}` }
  }

export const init = (app: Router): void => {
  // ==== READ
  app.get('/expression/literal/item', async (req, res) => {
    const { surveyId, type, value } = Request.getParams(req)

    if (NodeDef.nodeDefType.code === type) {
      const { categoryUuid, lang } = Request.getParams(req)

      const itemsDb = await CategoryManager.fetchItemsByLevelIndex({
        surveyId,
        categoryUuid,
        levelIndex: 0,
        draft: true,
      })

      const item = A.pipe(
        A.find((_item) => CategoryItem.getCode(_item) === value),
        toItem(type, lang)
      )(itemsDb)

      res.json({ item })
    } else if (NodeDef.nodeDefType.taxon === type) {
      const { taxonomyUuid } = Request.getParams(req)

      const itemDb = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, value, true)

      res.json({ item: toItem(type)(itemDb) })
    } else {
      throw new SystemError('invalidType', { type })
    }
  })

  app.get('/expression/literal/items', async (req, res) => {
    const { surveyId, type, value } = Request.getParams(req)

    if (NodeDef.nodeDefType.code === type) {
      const { categoryUuid, categoryLevelIndex, lang } = Request.getParams(req)

      const itemsDb = await CategoryManager.fetchItemsByLevelIndex({
        surveyId,
        categoryUuid,
        levelIndex: Number(categoryLevelIndex),
        draft: true,
      })

      const items = A.pipe(
        A.ifElse(
          A.always(isBlank(value)),
          A.identity,
          A.filter((item) => {
            const code = CategoryItem.getCode(item)
            const label = CategoryItem.getLabel(lang)(item)
            return contains(value, code) || contains(value, label)
          })
        ),
        A.sort((a, b) => Number(a.id) - Number(b.id)),
        A.take(25),
        A.map(toItem(type, lang))
      )(itemsDb)

      res.json({ items })
    } else if (NodeDef.nodeDefType.taxon === type) {
      const { taxonomyUuid } = Request.getParams(req)

      const itemsDb = await TaxonomyManager.findTaxaByCodeOrScientificName({
        surveyId,
        taxonomyUuid,
        filterValue: value,
        draft: true,
      })

      const items = itemsDb.map(toItem(type))

      res.json({ items })
    } else {
      throw new SystemError('invalidType', { type })
    }
  })
}
