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
const SurveyIndex = require('../../../../survey/index/surveyIndex')
const CollectRecordParseUtils = require('./collectRecordParseUtils')

const extractTextValue = CollectRecordParseUtils.getTextValue('value')

const extractCodeValue = (survey, nodeDef, surveyIndex, record, node) => collectNode => {
  const code = CollectRecordParseUtils.getTextValue('code')(collectNode)

  if (code) {
    const parentNode = Record.getParentNode(node)(record)
    const itemUuid = SurveyIndex.getCategoryItemUuid(survey, nodeDef, record, parentNode, code)(surveyIndex)

    return itemUuid
      ? { [Node.valuePropKeys.itemUuid]: itemUuid }
      : null
  } else {
    return null
  }
}

const extractCoordinateValue = collectNode => {
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

const extractDateValue = collectNode => {
  const { day, month, year } = CollectRecordParseUtils.getTextValues(collectNode)
  return DateUtils.formatDate(day, month, year)
}

const extractFileValue = (survey, node, collectSurvey, collectSurveyFileZip, collectNodeDefPath, tx) => async collectNode => {
  const { file_name, file_size } = CollectRecordParseUtils.getTextValues(collectNode)

  const collectNodeDef = CollectRecordParseUtils.getCollectNodeDefByPath(collectSurvey, collectNodeDefPath)

  const collectNodeDefId = collectNodeDef.attributes.id
  const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${file_name}`)

  if (content) {
    const fileUuid = uuidv4()
    const file = RecordFile.createFile(fileUuid, file_name, file_size, content, Node.getRecordUuid(node), Node.getUuid(node))
    await FileManager.insertFile(Survey.getId(survey), file, tx)

    return {
      [Node.valuePropKeys.fileUuid]: fileUuid,
      [Node.valuePropKeys.fileName]: file_name,
      [Node.valuePropKeys.fileSize]: file_size
    }
  } else {
    return null
  }
}

const extractTaxonValue = (nodeDef, surveyIndex) => collectNode => {
  const { code, scientific_name, vernacular_name } = CollectRecordParseUtils.getTextValues(collectNode)
  const taxonUuid = SurveyIndex.getTaxonUuid(nodeDef, code)(surveyIndex)

  if (taxonUuid) {
    const taxonValue = { [Node.valuePropKeys.taxonUuid]: taxonUuid }

    if (code === Taxon.unlistedCode) {
      taxonValue[Node.valuePropKeys.scientificName] = scientific_name
    }

    if (vernacular_name) {
      const vernacularNameUuid = SurveyIndex.getTaxonVernacularNameUuid(nodeDef, code, vernacular_name)(surveyIndex)
      if (vernacularNameUuid) {
        taxonValue[Node.valuePropKeys.vernacularNameUuid] = vernacularNameUuid
      } else {
        taxonValue[Node.valuePropKeys.vernacularName] = vernacular_name
      }
    }

    return taxonValue
  } else {
    return null
  }
}

const extractTimeValue = collectNode => {
  const { hour, minute } = CollectRecordParseUtils.getTextValues(collectNode)
  return DateUtils.formatTime(hour, minute)
}

const extractAttributeValue = async (
  survey, nodeDef, record, node, surveyIndex, // arena items
  collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, // collect items
  tx,
) => {

  switch (NodeDef.getType(nodeDef)) {
    case nodeDefType.boolean:
    case nodeDefType.decimal:
    case nodeDefType.integer:
    case nodeDefType.text:
      return extractTextValue(collectNode)

    case nodeDefType.code:
      return extractCodeValue(survey, nodeDef, surveyIndex, record, node)(collectNode)

    case nodeDefType.coordinate:
      return extractCoordinateValue(collectNode)

    case nodeDefType.date:
      return extractDateValue(collectNode)

    case nodeDefType.file:
      return await extractFileValue(survey, node, collectSurvey, collectSurveyFileZip, collectNodeDefPath, tx)(collectNode)

    case nodeDefType.taxon:
      return extractTaxonValue(nodeDef, surveyIndex)(collectNode)

    case nodeDefType.time:
      return extractTimeValue(collectNode)

  }
}

module.exports = {
  extractAttributeValue
}