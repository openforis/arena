import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as DateUtils from '@core/dateUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
const { nodeDefType } = NodeDef
import * as Taxon from '@core/survey/taxon'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordFile from '@core/record/recordFile'

import * as FileManager from '../../../../record/manager/fileManager'
import * as CollectSurvey from '../model/collectSurvey'
import * as CollectRecord from '../model/collectRecord'

const extractTextValueAndMeta = (collectNode, collectNodeField = 'value') => {
  const value = CollectRecord.getTextValue(collectNodeField)(collectNode)
  return value ? { value } : null
}

const extractCodeValueAndMeta = (
  survey,
  nodeDef,
  record,
  node,
) => collectNode => {
  const code = CollectRecord.getTextValue('code')(collectNode)

  if (code) {
    const parentNode = Record.getParentNode(node)(record)
    const {
      itemUuid,
      hierarchyCode,
    } = Survey.getCategoryItemUuidAndCodeHierarchy(
      survey,
      nodeDef,
      record,
      parentNode,
      code,
    )(survey)

    return itemUuid
      ? {
          value: {
            [Node.valuePropKeys.itemUuid]: itemUuid,
          },
          meta: {
            [Node.metaKeys.hierarchyCode]: hierarchyCode,
          },
        }
      : null
  }

  return null
}

const extractCoordinateValueAndMeta = collectNode => {
  const { x, y, srs } = CollectRecord.getTextValues(collectNode)

  if (x && y && srs) {
    const srsId = R.ifElse(
      R.isEmpty,
      R.identity,
      R.pipe(R.split(':'), R.last),
    )(srs)

    return {
      value: {
        [Node.valuePropKeys.x]: x,
        [Node.valuePropKeys.y]: y,
        [Node.valuePropKeys.srs]: srsId,
      },
    }
  }

  return null
}

const extractDateValueAndMeta = collectNode => {
  const { day, month, year } = CollectRecord.getTextValues(collectNode)
  return {
    value: DateUtils.formatDate(day, month, year),
  }
}

const extractFileValueAndMeta = (
  survey,
  node,
  collectSurvey,
  collectSurveyFileZip,
  collectNodeDef,
  tx,
) => async collectNode => {
  const { file_name, file_size } = CollectRecord.getTextValues(collectNode)

  const collectNodeDefId = CollectSurvey.getAttribute('id')(collectNodeDef)
  const content = collectSurveyFileZip.getEntryData(
    `upload/${collectNodeDefId}/${file_name}`,
  )

  if (content) {
    const fileUuid = uuidv4()
    const file = RecordFile.createFile(
      fileUuid,
      file_name,
      file_size,
      content,
      Node.getRecordUuid(node),
      Node.getUuid(node),
    )
    await FileManager.insertFile(Survey.getId(survey), file, tx)

    return {
      value: {
        [Node.valuePropKeys.fileUuid]: fileUuid,
        [Node.valuePropKeys.fileName]: file_name,
        [Node.valuePropKeys.fileSize]: file_size,
      },
    }
  }

  return null
}

const extractTaxonValueAndMeta = (survey, nodeDef) => collectNode => {
  const {
    code,
    scientific_name,
    vernacular_name,
  } = CollectRecord.getTextValues(collectNode)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, code)(survey)

  if (taxonUuid) {
    const value = {
      [Node.valuePropKeys.taxonUuid]: taxonUuid,
    }

    if (code === Taxon.unlistedCode) {
      value[Node.valuePropKeys.scientificName] = scientific_name
    }

    if (vernacular_name) {
      const vernacularNameUuid = Survey.getTaxonVernacularNameUuid(
        nodeDef,
        code,
        vernacular_name,
      )(survey)
      if (vernacularNameUuid) {
        value[Node.valuePropKeys.vernacularNameUuid] = vernacularNameUuid
      } else {
        value[Node.valuePropKeys.vernacularName] = vernacular_name
      }
    }

    return {
      value,
    }
  }

  return null
}

const extractTimeValueAndMeta = collectNode => {
  const { hour, minute } = CollectRecord.getTextValues(collectNode)
  return {
    value: DateUtils.formatTime(hour, minute),
  }
}

export const extractAttributeValueAndMeta = async (
  survey,
  nodeDef,
  record,
  node, // Arena items
  collectSurveyFileZip,
  collectSurvey,
  collectNodeDef,
  collectNode,
  collectNodeField, // Collect items
  tx,
) => {
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
      return await extractFileValueAndMeta(
        survey,
        node,
        collectSurvey,
        collectSurveyFileZip,
        collectNodeDef,
        tx,
      )(collectNode)

    case nodeDefType.taxon:
      return extractTaxonValueAndMeta(survey, nodeDef)(collectNode)

    case nodeDefType.time:
      return extractTimeValueAndMeta(collectNode)
  }
}
