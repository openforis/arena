const R = require('ramda')

const { uuidv4 } = require('../../../../../../common/uuid')
const DateUtils = require('../../../../../../common/dateUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef
const Taxon = require('../../../../../../common/survey/taxon')

const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')
const RecordFile = require('../../../../../../common/record/recordFile')

const FileManager = require('../../../../record/manager/fileManager')
const CollectRecordParseUtils = require('./collectRecordParseUtils')

const extractTextValueAndMeta = collectNode => {
  const value = CollectRecordParseUtils.getTextValue('value')(collectNode)
  return value
    ? { value }
    : null
}

const extractCodeValueAndMeta = (survey, nodeDef, record, node) => collectNode => {
  const code = CollectRecordParseUtils.getTextValue('code')(collectNode)

  if (code) {
    const parentNode = Record.getParentNode(node)(record)
    const { itemUuid, hierarchyCode } = Survey.getCategoryItemUuidAndCodeHierarchy(survey, nodeDef, record, parentNode, code)(survey)

    return itemUuid
      ? {
        value: {
          [Node.valuePropKeys.itemUuid]: itemUuid
        },
        meta: {
          [Node.metaKeys.hierarchyCode]: hierarchyCode
        }
      }
      : null
  } else {
    return null
  }
}

const extractCoordinateValueAndMeta = collectNode => {
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
      value: {
        [Node.valuePropKeys.x]: x,
        [Node.valuePropKeys.y]: y,
        [Node.valuePropKeys.srs]: srsId
      }
    }
  } else {
    return null
  }
}

const extractDateValueAndMeta = collectNode => {
  const { day, month, year } = CollectRecordParseUtils.getTextValues(collectNode)
  return {
    value: DateUtils.formatDate(day, month, year)
  }
}

const extractFileValueAndMeta = (survey, node, collectSurvey, collectSurveyFileZip, collectNodeDefPath, tx) => async collectNode => {
  const { file_name, file_size } = CollectRecordParseUtils.getTextValues(collectNode)

  const collectNodeDef = CollectRecordParseUtils.getCollectNodeDefByPath(collectSurvey, collectNodeDefPath)

  const collectNodeDefId = collectNodeDef.attributes.id
  const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${file_name}`)

  if (content) {
    const fileUuid = uuidv4()
    const file = RecordFile.createFile(fileUuid, file_name, file_size, content, Node.getRecordUuid(node), Node.getUuid(node))
    await FileManager.insertFile(Survey.getId(survey), file, tx)

    return {
      value: {
        [Node.valuePropKeys.fileUuid]: fileUuid,
        [Node.valuePropKeys.fileName]: file_name,
        [Node.valuePropKeys.fileSize]: file_size
      }
    }
  } else {
    return null
  }
}

const extractTaxonValueAndMeta = (survey, nodeDef) => collectNode => {
  const { code, scientific_name, vernacular_name } = CollectRecordParseUtils.getTextValues(collectNode)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, code)(survey)

  if (taxonUuid) {
    const value = {
      [Node.valuePropKeys.taxonUuid]: taxonUuid
    }

    if (code === Taxon.unlistedCode) {
      value[Node.valuePropKeys.scientificName] = scientific_name
    }

    if (vernacular_name) {
      const vernacularNameUuid = Survey.getTaxonVernacularNameUuid(nodeDef, code, vernacular_name)(survey)
      if (vernacularNameUuid) {
        value[Node.valuePropKeys.vernacularNameUuid] = vernacularNameUuid
      } else {
        value[Node.valuePropKeys.vernacularName] = vernacular_name
      }
    }

    return {
      value
    }
  } else {
    return null
  }
}

const extractTimeValueAndMeta = collectNode => {
  const { hour, minute } = CollectRecordParseUtils.getTextValues(collectNode)
  return {
    value: DateUtils.formatTime(hour, minute)
  }
}

const extractAttributeValueAndMeta = async (
  survey, nodeDef, record, node, // arena items
  collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, // collect items
  tx,
) => {

  switch (NodeDef.getType(nodeDef)) {
    case nodeDefType.boolean:
    case nodeDefType.decimal:
    case nodeDefType.integer:
    case nodeDefType.text:
      return extractTextValueAndMeta(collectNode)

    case nodeDefType.code:
      return extractCodeValueAndMeta(survey, nodeDef, record, node)(collectNode)

    case nodeDefType.coordinate:
      return extractCoordinateValueAndMeta(collectNode)

    case nodeDefType.date:
      return extractDateValueAndMeta(collectNode)

    case nodeDefType.file:
      return await extractFileValueAndMeta(survey, node, collectSurvey, collectSurveyFileZip, collectNodeDefPath, tx)(collectNode)

    case nodeDefType.taxon:
      return extractTaxonValueAndMeta(survey, nodeDef)(collectNode)

    case nodeDefType.time:
      return extractTimeValueAndMeta(collectNode)
  }
}

module.exports = {
  extractAttributeValueAndMeta
}