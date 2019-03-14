const R = require('ramda')
const { uuidv4 } = require('../../../../../../common/uuid')

const DateUtils = require('../../../../../../common/dateUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Category = require('../../../../../../common/survey/category')
const Taxonomy = require('../../../../../../common/survey/taxonomy')
const Node = require('../../../../../../common/record/node')
const RecordFile = require('../../../../../../common/record/recordFile')

const CategoryManager = require('../../../../category/persistence/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/persistence/taxonomyManager')
const FileManager = require('../../../../record/persistence/fileManager')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')

const getCollectNodeDefByPath = (collectSurvey, collectNodeDefPath) => {
  const collectAncestorNodeNames = R.pipe(
    R.split('/'),
    R.reject(R.isEmpty)
  )(collectNodeDefPath)

  let currentCollectNode = CollectIdmlParseUtils.getElementByName('schema')(collectSurvey)

  for (const collectAncestorNodeName of collectAncestorNodeNames) {
    const collectChildNodeDef = R.pipe(
      R.propOr([], 'elements'),
      R.find(R.pathEq(['attributes', 'name'], collectAncestorNodeName))
    )(currentCollectNode)

    if (collectChildNodeDef)
      currentCollectNode = collectChildNodeDef
    else {
      console.log(`child node def ${collectAncestorNodeName} not found in node def ${currentCollectNode}`)
      return null //node def not found
    }
  }

  return currentCollectNode
}

const extractAttributeValue = async (survey, nodeDef, node, collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, tx) => {
  const surveyId = Survey.getId(survey)

  switch (NodeDef.getType(nodeDef)) {
    case nodeDefType.boolean:
    case nodeDefType.decimal:
    case nodeDefType.integer:
    case nodeDefType.text:
      return getVal('value')(collectNode)
    case nodeDefType.code: {
      const code = getVal('code')(collectNode)

      const categoryUuid = NodeDef.getNodeDefCategoryUuid(nodeDef)
      const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
      const items = await CategoryManager.fetchItemsByLevelIndex(surveyId, categoryUuid, levelIndex, false, tx)
      const item = R.find(item => Category.getItemCode(item) === code, items)
      return item
        ? { [Node.valuePropKeys.itemUuid]: Category.getUuid(item) }
        : null
    }
    case nodeDefType.coordinate: {
      const { x, y, srs } = collectNode

      return {
        [Node.valuePropKeys.x]: x,
        [Node.valuePropKeys.y]: y,
        [Node.valuePropKeys.srs]: srs
      }
    }
    case nodeDefType.date: {
      const { day, month, year} = getValues(collectNode)

      return DateUtils.formatDate(day, month, year)
    }
    case nodeDefType.time: {
      const { hour, minute} = getValues(collectNode)

      return DateUtils.formatTime(hour, minute)
    }
    case nodeDefType.taxon: {
      const { code, scientific_name, vernacularName } = getValues(collectNode)

      const taxonomyUuid = NodeDef.getNodeDefTaxonomyUuid(nodeDef)

      const unlistedTaxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, Taxonomy.unlistedCode, false, tx)

      if (vernacularName) {

        const taxa = await TaxonomyManager.fetchTaxaByVernacularName(surveyId, taxonomyUuid, vernacularName, false, false, tx)
        const taxon = R.head(taxa)

        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(taxon),
            [Node.valuePropKeys.vernacularNameUuid]: Taxonomy.getTaxonVernacularNameUuid(taxon),
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(unlistedTaxon),
            [Node.valuePropKeys.vernacularName]: vernacularName
          }
      } else if (code) {
        const taxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, code, false, tx)
        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(taxon)
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(unlistedTaxon),
            [Node.valuePropKeys.scientificName]: scientific_name
          }

      } else {
        return null
      }
    }
    case nodeDefType.file: {
      const { file_name, file_size } = getValues(collectNode)

      const collectNodeDef = getCollectNodeDefByPath(collectSurvey, collectNodeDefPath)

      if (R.isNil(collectNodeDef)) {
        console.log('node def not found', collectNodeDefPath)
        console.log('collectSurvey', collectSurvey)
      } else {
        const collectNodeDefId = collectNodeDef.attributes.id
        const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${file_name}`)

        if (content) {
          const fileUuid = uuidv4()
          const file = RecordFile.createFile(fileUuid, file_name, file_size, content, Node.getRecordUuid(node), Node.getUuid(node))
          await FileManager.insertFile(surveyId, file, tx)

          return {
            [Node.valuePropKeys.fileUuid]: fileUuid,
            [Node.valuePropKeys.fileName]: file_name,
            [Node.valuePropKeys.fileSize]: file_size
          }
        } else {
          return null
        }
      }
    }
  }
}

const getVal = prop => R.path([prop, '_text'])

const getValues = valObj => R.pipe(
  R.keys,
  R.reduce((acc, prop) => R.assoc(prop, getVal(prop)(valObj), acc), {})
)(valObj)

module.exports = {
  extractAttributeValue
}