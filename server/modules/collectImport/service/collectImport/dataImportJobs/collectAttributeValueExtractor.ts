import type {
  Survey as ArenaSurvey,
  NodeDef as ArenaNodeDef,
  NodeDefType,
  ArenaRecordNode,
  Record as ArenaRecord,
} from '@openforis/arena-core'
import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

import * as DateUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as SurveyFile from '@core/survey/surveyFile'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'

import { db, DbClient } from '@server/db/db'

import { insertFile } from '@server/modules/survey/manager/surveyFileManager'
import * as CollectRecord from '../model/collectRecord'
import * as CollectSurvey from '../model/collectSurvey'

const { nodeDefType } = NodeDef

const extractTextValueAndMeta = (collectNode: CollectRecord.CollectNode, collectNodeField = 'value') => {
  const value = CollectRecord.getTextValue(collectNodeField)(collectNode)
  return value ? { value } : null
}

const findCategoryItemUuidAndCodeHierarchy = async ({
  survey,
  categoryItemProvider,
  nodeDef,
  code,
  record,
  parentNode,
  client = db,
}: {
  survey: ArenaSurvey
  categoryItemProvider: any
  nodeDef: ArenaNodeDef<NodeDefType>
  code: string
  record: ArenaRecord
  parentNode: ArenaRecordNode
  client?: DbClient
}) => {
  const { itemUuid, hierarchyCode } = Survey.getCategoryItemUuidAndCodeHierarchy({
    nodeDef,
    code,
    record,
    parentNode,
  })(survey)
  if (itemUuid) {
    return { itemUuid, hierarchyCode }
  }
  const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const parentItemUuid = parentCodeAttribute ? Node.getCategoryItemUuid(parentCodeAttribute) : null
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const item = await categoryItemProvider.getItemByCode({
    survey,
    categoryUuid,
    parentItemUuid,
    code,
    draft: true,
    client,
  })
  return item
    ? { itemUuid: item.uuid, hierarchyCode: CategoryItem.getCodesHierarchy(item) }
    : { itemUuid: null, hierarchyCode: null }
}

const extractCodeValueAndMeta =
  ({ survey, categoryItemProvider, nodeDef, record, node, tx }) =>
  async (collectNode: CollectRecord.CollectNode) => {
    const code = CollectRecord.getTextValue('code')(collectNode)
    if (Objects.isEmpty(code)) {
      return null
    }
    const parentNode = Record.getParentNode(node)(record)
    const { itemUuid, hierarchyCode } = await findCategoryItemUuidAndCodeHierarchy({
      survey,
      categoryItemProvider,
      nodeDef,
      code,
      record,
      parentNode,
      client: tx,
    })
    if (!itemUuid) {
      return null
    }
    return {
      value: Node.newNodeValueCode({ itemUuid }),
      meta: {
        [Node.metaKeys.hierarchyCode]: hierarchyCode,
      },
    }
  }

const extractCoordinateValueAndMeta = ({
  nodeDef,
  collectNode,
}: {
  nodeDef: ArenaNodeDef<NodeDefType>
  collectNode: CollectRecord.CollectNode
}) => {
  const { x, y, srs, accuracy, altitude } = CollectRecord.getTextValues(collectNode)

  if (!Objects.isEmpty(x) && !Objects.isEmpty(y) && !Objects.isEmpty(srs)) {
    const srsId = A.ifElse(A.isEmpty, A.identity, A.pipe(A.split(':'), A.last))(srs)
    const value = {
      [Node.valuePropsCoordinate.x]: Number(x),
      [Node.valuePropsCoordinate.y]: Number(y),
      [Node.valuePropsCoordinate.srs]: srsId,
    }
    if (NodeDef.isAccuracyIncluded(nodeDef) && !Objects.isEmpty(accuracy))
      value[Node.valuePropsCoordinate.accuracy] = Number(accuracy)
    if (NodeDef.isAltitudeIncluded(nodeDef) && !Objects.isEmpty(altitude))
      value[Node.valuePropsCoordinate.altitude] = Number(altitude)

    return { value }
  }
  // invalid or empty value
  return null
}

const extractDateValueAndMeta = (collectNode: CollectRecord.CollectNode) => {
  const { day, month, year } = CollectRecord.getTextValues(collectNode)

  if (!NumberUtils.isInteger(year) || !NumberUtils.isInteger(month) || !NumberUtils.isInteger(day)) {
    return { value: null }
  }
  const date = new Date(year, month - 1, day)
  return { value: DateUtils.formatDateISO(date) }
}

const extractFileValueAndMeta =
  (
    survey: ArenaSurvey,
    node: ArenaRecordNode,
    collectSurveyFileZip: any,
    collectNodeDef: CollectSurvey.CollectNodeDef,
    tx: DbClient
  ) =>
  async (collectNode: CollectRecord.CollectNode) => {
    const { file_name: fileName } = CollectRecord.getTextValues(collectNode)

    const collectNodeDefId = CollectSurvey.getAttribute('id')(collectNodeDef)
    const content = collectSurveyFileZip.getEntryData(`upload/${collectNodeDefId}/${fileName}`)

    if (content) {
      const fileSize = Buffer.byteLength(content)
      const file = SurveyFile.createFile({
        name: fileName,
        size: fileSize,
        content,
        recordUuid: Node.getRecordUuid(node),
        nodeUuid: Node.getUuid(node),
        type: SurveyFile.SurveyFileType.recordAttachment,
      })
      await insertFile(Survey.getId(survey), file, tx)

      return {
        value: {
          [Node.valuePropsFile.fileUuid]: SurveyFile.getUuid(file),
          [Node.valuePropsFile.fileName]: fileName,
          [Node.valuePropsFile.fileSize]: fileSize,
        },
      }
    }

    return null
  }

const findTaxonUuid = async ({
  survey,
  taxonProvider,
  nodeDef,
  taxonCode,
}: {
  survey: ArenaSurvey
  taxonProvider: any
  nodeDef: ArenaNodeDef<NodeDefType>
  taxonCode: any
}) => {
  const taxonUuid = Survey.getTaxonUuid(nodeDef, taxonCode)(survey)
  if (taxonUuid) return taxonUuid
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxon = await taxonProvider.getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  return taxon ? Taxon.getUuid(taxon) : null
}

const extractTaxonValueAndMeta =
  ({ survey, taxonProvider, nodeDef }) =>
  async (collectNode: CollectRecord.CollectNode) => {
    const {
      code: taxonCode,
      scientific_name: scientificName,
      vernacular_name: vernacularName,
    } = CollectRecord.getTextValues(collectNode)

    const taxonUuid = await findTaxonUuid({ survey, taxonProvider, nodeDef, taxonCode })
    if (!taxonUuid) {
      return null
    }
    const value = {
      [Node.valuePropsTaxon.taxonUuid]: taxonUuid,
    }

    if (taxonCode === Taxon.unlistedCode) {
      value[Node.valuePropsTaxon.scientificName] = scientificName
    }

    if (vernacularName) {
      const vernacularNameUuid = Survey.getTaxonVernacularNameUuid({ nodeDef, taxonCode, vernacularName })(survey)
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

const extractTimeValueAndMeta = (collectNode: CollectRecord.CollectNode) => {
  const { hour, minute } = CollectRecord.getTextValues(collectNode)

  const value =
    !NumberUtils.isInteger(hour) || !NumberUtils.isInteger(minute) ? null : DateUtils.formatTime(hour, minute)

  return { value }
}

// params of the extraction of the value (and meta) of an Arena attribute from the matching Collect node
type AttributeValueExtractParams = {
  survey: ArenaSurvey
  categoryItemProvider?: any
  taxonProvider?: any
  nodeDef: ArenaNodeDef<NodeDefType>
  record?: ArenaRecord
  node?: ArenaRecordNode
  collectSurveyFileZip?: any
  collectNodeDef?: CollectSurvey.CollectNodeDef
  collectNode: CollectRecord.CollectNode
  collectNodeField?: string
  tx?: DbClient
}

type AttributeValueAndMeta = { value?: unknown; meta?: Record<string, unknown> } | null

type AttributeValueExtractor = (
  params: AttributeValueExtractParams
) => AttributeValueAndMeta | Promise<AttributeValueAndMeta>

const valueAndMetaExtractorByType: Record<string, AttributeValueExtractor> = {
  [nodeDefType.boolean]: ({ collectNode, collectNodeField }) => extractTextValueAndMeta(collectNode, collectNodeField),
  [nodeDefType.code]: ({ collectNode, survey, categoryItemProvider, nodeDef, record, node, tx = db }) =>
    extractCodeValueAndMeta({ survey, categoryItemProvider, nodeDef, record, node, tx })(collectNode),
  [nodeDefType.coordinate]: ({ collectNode, nodeDef }) => extractCoordinateValueAndMeta({ nodeDef, collectNode }),
  [nodeDefType.date]: ({ collectNode }) => extractDateValueAndMeta(collectNode),
  [nodeDefType.decimal]: ({ collectNode, collectNodeField }) => extractTextValueAndMeta(collectNode, collectNodeField),
  [nodeDefType.file]: ({ collectNode, survey, node, collectSurveyFileZip, collectNodeDef, tx }) =>
    extractFileValueAndMeta(survey, node, collectSurveyFileZip, collectNodeDef, tx)(collectNode),
  [nodeDefType.integer]: ({ collectNode, collectNodeField }) => extractTextValueAndMeta(collectNode, collectNodeField),
  [nodeDefType.taxon]: ({ collectNode, survey, taxonProvider, nodeDef }) =>
    extractTaxonValueAndMeta({ survey, taxonProvider, nodeDef })(collectNode),
  [nodeDefType.text]: ({ collectNode, collectNodeField }) => extractTextValueAndMeta(collectNode, collectNodeField),
  [nodeDefType.time]: ({ collectNode }) => extractTimeValueAndMeta(collectNode),
}

export const extractAttributeValueAndMeta = async ({
  survey,
  categoryItemProvider,
  taxonProvider,
  nodeDef,
  record,
  node, // Arena items
  collectSurveyFileZip,
  collectNodeDef,
  collectNode,
  collectNodeField, // Collect items
  tx,
}: AttributeValueExtractParams): Promise<AttributeValueAndMeta> => {
  const nodeDefType = NodeDef.getType(nodeDef)
  const valueAndMetaExtractor = valueAndMetaExtractorByType[nodeDefType]
  // async: an unknown type must reject, not throw
  if (!valueAndMetaExtractor) throw new Error(`Unknown NodeDef type: ${nodeDefType}`)

  return await valueAndMetaExtractor({
    collectSurveyFileZip,
    collectNode,
    collectNodeDef,
    collectNodeField,
    survey,
    categoryItemProvider,
    taxonProvider,
    nodeDef,
    record,
    node,
    tx,
  })
}
