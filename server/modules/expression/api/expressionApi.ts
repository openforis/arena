import * as R from 'ramda';
import NodeDef from '../../../../core/survey/nodeDef';
import CategoryItem, { ICategoryItem } from '../../../../core/survey/categoryItem';
import Taxon from '../../../../core/survey/taxon';
import { isBlank, contains } from '../../../../core/stringUtils';
import CategoryManager from '../../category/manager/categoryManager';
import TaxonomyManager from '../../taxonomy/manager/taxonomyManager';
import SystemError from '../../../utils/systemError';
import * as Request from '../../../utils/request';

const toItem = (type, lang = null) =>
  item => item
    ?
    (
      type === NodeDef.nodeDefType.code
        ? {
          key: CategoryItem.getCode(item),
          label: CategoryItem.getLabel(lang)(item),
        }
        : {
          key: Taxon.getCode(item),
          label: Taxon.getScientificName(item),
        }
    )
    : null

export const init = app => {

  // ==== READ
  app.get('/expression/literal/item', async (req, res, next) => {
    try {
      const { surveyId, type, value } = Request.getParams(req)

      if (NodeDef.nodeDefType.code === type) {
        const { categoryUuid, lang } = Request.getParams(req)

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, 0, true)

        const item = R.pipe(
          R.find(item => CategoryItem.getCode(item) === value),
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
    } catch (err) {
      next(err)
    }
  })

  app.get('/expression/literal/items', async (req, res, next) => {
    try {
      const { surveyId, type, value } = Request.getParams(req)

      if (NodeDef.nodeDefType.code === type) {
        const { categoryUuid, categoryLevelIndex, lang } = Request.getParams(req)

        const itemsDb: ICategoryItem[] = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, categoryLevelIndex, true)

        const items = R.pipe(
          R.ifElse(
            R.always(isBlank(value)),
            R.identity,
            R.filter((item: ICategoryItem) => {
              const code = CategoryItem.getCode(item)
              const label = CategoryItem.getLabel(lang)(item)
              return contains(value, code) || contains(value, label)
            })
          ),
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
    } catch (err) {
      next(err)
    }
  })

};
