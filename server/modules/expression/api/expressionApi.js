const R = require('ramda')

const NodeDef = require('../../../../common/survey/nodeDef')
const Category = require('../../../../common/survey/category')
const Taxonomy = require('../../../../common/survey/taxonomy')
const { isBlank, contains } = require('../../../../common/stringUtils')

const CategoryManager = require('../../category/persistence/categoryManager')
const TaxonomyManager = require('../../taxonomy/persistence/taxonomyManager')

const { sendErr } = require('../../../serverUtils/response')
const { getRestParam } = require('../../../serverUtils/request')

const toItem = (type, lang = null) =>
  item => item
    ?
    (
      type === NodeDef.nodeDefType.code
        ? {
          key: Category.getItemCode(item),
          label: Category.getItemLabel(lang)(item),
        }
        : {
          key: Taxonomy.getTaxonCode(item),
          label: Taxonomy.getTaxonScientificName(item),
        }
    )
    : null

module.exports.init = app => {

  // ==== READ
  app.get('/expression/literal/item', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const type = getRestParam(req, 'type')
      const value = getRestParam(req, 'value')

      if (NodeDef.nodeDefType.code === type) {
        const categoryUuid = getRestParam(req, 'categoryUuid')
        const lang = getRestParam(req, 'lang')

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, 0, true)

        const item = R.pipe(
          R.find(item => Category.getItemCode(item) === value),
          toItem(type, lang)
        )(itemsDb)

        res.json({ item })

      } else if (NodeDef.nodeDefType.taxon === type) {
        const taxonomyUuid = getRestParam(req, 'taxonomyUuid')

        const itemDb = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, value, true)

        res.json({ item: toItem(type)(itemDb) })

      } else {
        throw new Error('invalid type ' + type)
      }
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/expression/literal/items', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const type = getRestParam(req, 'type')
      const value = getRestParam(req, 'value')

      if (NodeDef.nodeDefType.code === type) {

        const categoryUuid = getRestParam(req, 'categoryUuid')
        const categoryLevelIndex = getRestParam(req, 'categoryLevelIndex')
        const lang = getRestParam(req, 'lang')

        const itemsDb = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, categoryLevelIndex, true)

        const items = R.pipe(
          R.ifElse(
            R.always(isBlank(value)),
            R.identity,
            R.filter(item => {
              const code = Category.getItemCode(item)
              const label = Category.getItemLabel(lang)(item)
              return contains(value, code) || contains(value, label)
            })
          ),
          R.take(25),
          R.map(toItem(type, lang))
        )(itemsDb)

        res.json({ items })

      } else if (NodeDef.nodeDefType.taxon === type) {
        const taxonomyUuid = getRestParam(req, 'taxonomyUuid')

        const itemsDb = await TaxonomyManager.findTaxaByCodeOrScientificName(surveyId, taxonomyUuid, value, true)

        const items = itemsDb.map(toItem(type))

        res.json({ items })

      } else {
        throw new Error('invalid type ' + type)
      }
    } catch (err) {
      sendErr(res, err)
    }
  })

}