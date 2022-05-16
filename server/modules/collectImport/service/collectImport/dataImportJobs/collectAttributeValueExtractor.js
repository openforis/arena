import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NumberUtils from '@core/numberUtils'
import * as DateUtils from '@core/dateUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordFile from '@core/record/recordFile'

import * as FileManager from '../../../../record/manager/fileManager'
import * as CollectSurvey from '../model/collectSurvey'
import * as CollectRecord from '../model/collectRecord'

const { nodeDefType } = NodeDef

const extractTextValueAndMeta = (collectNode, collectNodeField = 'value') => {
  const value = CollectRecord.getTextValue(collectNodeField)(collectNode)
  return value ? { value } : null
}

const extractCodeValueAndMeta = (survey, nodeDef, record, node) => (collectNode) => {
  const code = CollectRecord.getTextValue('code')(collectNode)

  if (code) {
    const parentNode = Record.getParentNode(node)(record)
    const { itemUuid, hierarchyCode } = Survey.getCategoryItemUuidAndCodeHierarchy({
      nodeDef,
      code,
      record,
      parentNode,
    })(survey)

    return itemUuid
      ? {
          value: Node.newNodeValueCode({ itemUuid }),
          meta: {
            [Node.metaKeys.hierarchyCode]: hierarchyCode,
          },
        }
      : null
  }

  return null
}

const extractCoordinateValueAndMeta = (collectNode) => {
  const { x, y, srs } = CollectRecord.getTextValues(collectNode)

  if (x && y && srs) {
    const srsId = R.ifElse(R.isEmpty, R.identity, R.pipe(R.split(':'), R.last))(srs)

    return {
      value: {
        [Node.valuePropsCoordinate.x]: x,
        [Node.valuePropsCoordinate.y]: y,
        [Node.valuePropsCoordinate.srs]: srsId,
      },
    }
  }

  return null
}

const extractDateValueAndMeta = (collectNode) => {
  const { day, month, year } = CollectRecord.getTextValues(collectNode)

  if (!NumberUtils.isInteger(year) || !NumberUtils.isInteger(month) || !NumberUtils.isInteger(day)) {
    return { value: null }
  }
  const date = new Date(year, month - 1, day)
  return { value: DateUtils.formatDateISO(date) }
}

const extractFileValueAndMeta = (survey, node, collectSurveyFileZip, collectNodeDef, tx) => async (collectNode) => {
  const { file_name: fileName, file_size: fileSize } = CollectRecord.getTextValues(collectNode)

  const collectNodeDefId = CollectSurvey.getAttribute('id')(collectNodeDef)
  const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${fileName}`)

  if (content) {
    const fileUuid = uuidv4()
    const file = RecordFile.createFile(
      fileUuid,
      fileName,
      fileSize,
      content,
      Node.getRecordUuid(node),
      Node.getUuid(node)
    )
    await FileManager.insertFile(Survey.getId(survey), file, tx)

    return {
      value: {
        [Node.valuePropsFile.fileUuid]: fileUuid,
        [Node.valuePropsFile.fileName]: fileName,
        [Node.valuePropsFile.fileSize]: fileSize,
      },
    }
  }

  return null
}

const extractTaxonValueAndMeta = (survey, nodeDef) => (collectNode) => {
  const {
    code,
    scientific_name: scientificName,
    vernacular_name: vernacularName,
  } = CollectRecord.getTextValues(collectNode)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, code)(survey)

  if (taxonUuid) {
    const value = {
      [Node.valuePropsTaxon.taxonUuid]: taxonUuid,
    }

    if (code === Taxon.unlistedCode) {
      value[Node.valuePropsTaxon.scientificName] = scientificName
    }

    if (vernacularName) {
      const vernacularNameUuid = Survey.getTaxonVernacularNameUuid(nodeDef, code, vernacularName)(survey)
      if (vernacularNameUuid) {
        value[Node.valuePropsTaxon.vernacularNameUuid] = vernacularNameUuid
      } else {
        value[Node.valuePropsTaxon.vernacularName] = vernacularName
      }
    }

    return {
      value,
    }
  }

  return null
}

const extractTimeValueAndMeta = (collectNode) => {
  const { hour, minute } = CollectRecord.getTextValues(collectNode)

  const value =
    !NumberUtils.isInteger(hour) || !NumberUtils.isInteger(minute) ? null : DateUtils.formatTime(hour, minute)

  return { value }
}

export const extractAttributeValueAndMeta = async ({
  survey,
  nodeDef,
  record,
  node, // Arena items
  collectSurveyFileZip,
  collectNodeDef,
  collectNode,
  collectNodeField, // Collect items
  tx,
}) => {
  switch (NodeDef.getType(nodeDef)) {
    case nodeDefType.boolean:
    case nodeDefType.decimal:
    case nodeDefType.integer:
    case nodeDefType.text:
      return extractTextValueAndMeta(collectNode, collectNodeField)

    case nodeDefType.code:
      return extractCodeValueAndMeta(survey, nodeDef, record, node)(collectNode)

    case nodeDefType.coordinate:
      return extractCoordinateValueAndMeta(collectNode)

    case nodeDefType.date:
      return extractDateValueAndMeta(collectNode)

    case nodeDefType.file:
      return extractFileValueAndMeta(survey, node, collectSurveyFileZip, collectNodeDef, tx)(collectNode)

    case nodeDefType.taxon:
      return extractTaxonValueAndMeta(survey, nodeDef)(collectNode)

    case nodeDefType.time:
      return extractTimeValueAndMeta(collectNode)

    default:
      throw new Error(`Unknown NodeDef type: ${NodeDef.getType(nodeDef)}`)
  }
}
