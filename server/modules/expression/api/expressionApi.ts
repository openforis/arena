const R = require('ramda')

const NodeDef = require('../../../../core/survey/nodeDef')
const CategoryItem = require('../../../../core/survey/categoryItem')
const Taxon = require('../../../../core/survey/taxon')
const { isBlank, contains } = require('../../../../core/stringUtils')

const CategoryManager = require('../../category/manager/categoryManager')
const TaxonomyManager = require('../../taxonomy/manager/taxonomyManager')

const SystemError = require('../../../utils/systemError')
const Request = require('../../../utils/request')

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

module.exports.init = app => {

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

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, categoryLevelIndex, true)

        const items = R.pipe(
          R.ifElse(
            R.always(isBlank(value)),
            R.identity,
            R.filter(item => {
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

}