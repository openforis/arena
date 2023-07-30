import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import { isBlank, contains } from '@core/stringUtils'

import SystemError from '@core/systemError'
import * as Request from '@server/utils/request'
import * as CategoryManager from '../../category/manager/categoryManager'
import * as TaxonomyManager from '../../taxonomy/manager/taxonomyManager'

const toItem =
  (type, lang = null) =>
  (item) =>
    item
      ? type === NodeDef.nodeDefType.code
        ? {
            value: CategoryItem.getCode(item),
            label: CategoryItem.getLabel(lang)(item),
          }
        : {
            value: Taxon.getCode(item),
            label: Taxon.getScientificName(item),
          }
      : null

export const init = (app) => {
  // ==== READ
  app.get('/expression/literal/item', async (req, res, next) => {
    try {
      const { surveyId, type, value } = Request.getParams(req)

      if (NodeDef.nodeDefType.code === type) {
        const { categoryUuid, lang } = Request.getParams(req)

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex({
          surveyId,
          categoryUuid,
          levelIndex: 0,
          draft: true,
        })

        const item = R.pipe(
          R.find((_item) => CategoryItem.getCode(_item) === value),
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
    } catch (error) {
      next(error)
    }
  })

  app.get('/expression/literal/items', async (req, res, next) => {
    try {
      const { surveyId, type, value } = Request.getParams(req)

      if (NodeDef.nodeDefType.code === type) {
        const { categoryUuid, categoryLevelIndex, lang } = Request.getParams(req)

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex({
          surveyId,
          categoryUuid,
          levelIndex: Number(categoryLevelIndex),
          draft: true,
        })

        const items = R.pipe(
          R.ifElse(
            R.always(isBlank(value)),
            R.identity,
            R.filter((item) => {
              const code = CategoryItem.getCode(item)
              const label = CategoryItem.getLabel(lang)(item)
              return contains(value, code) || contains(value, label)
            })
          ),
          R.sort((a, b) => Number(a.id) - Number(b.id)),
          R.take(25),
          R.map(toItem(type, lang))
        )(itemsDb)

        res.json({ items })
      } else if (NodeDef.nodeDefType.taxon === type) {
        const { taxonomyUuid } = Request.getParams(req)

        const itemsDb = await TaxonomyManager.findTaxaByCodeOrScientificName(surveyId, taxonomyUuid, value, true)

        const items = itemsDb.map(toItem(type))

        res.json({ items })
      } else {
        throw new SystemError('invalidType', { type })
      }
    } catch (error) {
      next(error)
    }
  })
}
