const R = require('ramda')
const { uuidv4 } = require('../../../../../../common/uuid')

const DateUtils = require('../../../../../../common/dateUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Category = require('../../../../../../common/survey/category')
const Taxon = require('../../../../../../common/survey/taxon')
const Node = require('../../../../../../common/record/node')
const RecordFile = require('../../../../../../common/record/recordFile')

const CategoryManager = require('../../../../category/manager/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/manager/taxonomyManager')
const FileManager = require('../../../../record/manager/fileManager')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')
const CollectRecordParseUtils = require('./collectRecordParseUtils')

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
      return CollectRecordParseUtils.getTextValue('value')(collectNode)
    case nodeDefType.code: {
      const code = CollectRecordParseUtils.getTextValue('code')(collectNode)

      if (code) {
        const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
        const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
        const item = await CategoryManager.findItemByCode(surveyId, categoryUuid, levelIndex, code, false, tx)

        return item
          ? { [Node.valuePropKeys.itemUuid]: Category.getUuid(item) }
          : null
      } else {
        return null
      }
    }
    case nodeDefType.coordinate: {
      const { x, y, srs } = CollectRecordParseUtils.getTextValues(collectNode)

      if (x && y && srs) {
        const srsId = R.ifElse(
          R.isEmpty,
          R.identity,
          R.pipe(
            R.split(':'),
            R.last
          )
        )(srs)

        return {
          [Node.valuePropKeys.x]: x,
          [Node.valuePropKeys.y]: y,
          [Node.valuePropKeys.srs]: srsId
        }
      } else {
        return null
      }
    }
    case nodeDefType.date: {
      const { day, month, year } = CollectRecordParseUtils.getTextValues(collectNode)

      return DateUtils.formatDate(day, month, year)
    }
    case nodeDefType.file: {
      const { file_name, file_size } = CollectRecordParseUtils.getTextValues(collectNode)

      const collectNodeDef = getCollectNodeDefByPath(collectSurvey, collectNodeDefPath)

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
    case nodeDefType.taxon: {
      const { code, scientific_name, vernacularName } = CollectRecordParseUtils.getTextValues(collectNode)

      const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)

      const unlistedTaxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, Taxon.unlistedCode, false, tx)

      if (vernacularName) {

        const taxa = await TaxonomyManager.fetchTaxaByVernacularName(surveyId, taxonomyUuid, vernacularName, false, false, tx)
        const taxon = R.head(taxa)

        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxon.getUuid(taxon),
            [Node.valuePropKeys.vernacularNameUuid]: Taxon.getVernacularNameUuid(taxon),
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxon.getUuid(unlistedTaxon),
            [Node.valuePropKeys.vernacularName]: vernacularName
          }
      } else if (code) {
        const taxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, code, false, tx)
        return taxon
          ? {
            [Node.valuePropKeys.taxonUuid]: Taxon.getUuid(taxon)
          }
          : {
            [Node.valuePropKeys.taxonUuid]: Taxon.getUuid(unlistedTaxon),
            [Node.valuePropKeys.scientificName]: scientific_name
          }

      } else {
        return null
      }
    }
    case nodeDefType.time: {
      const { hour, minute } = CollectRecordParseUtils.getTextValues(collectNode)

      return DateUtils.formatTime(hour, minute)
    }
  }
}

module.exports = {
  extractAttributeValue
}