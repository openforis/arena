import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { NodeDefs, Nodes, Objects, Records, Surveys } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'
import { fetchRecordAndNodesOnce, getResolvedRecord } from '../fetchedRecordsCache'

export const useRecord = () => useSelector(RecordState.getRecord)

export const useRecordNode = ({ nodeUuid }) => {
  const record = useSelector(RecordState.getRecord)
  return nodeUuid && record ? Record.getNodeByUuid(nodeUuid)(record) : null
}

/**
 * Returns the record currently being edited from the ui/record Redux state, when available (e.g. in the
 * record entry view). When it's not available (e.g. in the Data Explorer inline table editor, where only
 * a partial row - not a full Record with nodes - is passed as props), but the code attribute belongs to a
 * hierarchical category (nodeDef has a parentCodeDefUuid) and a parentNode with a recordUuid is available,
 * it fetches and caches the full record on demand, so that the ancestor code attribute can still be
 * resolved. Skipped for non-hierarchical (single-level) categories, which don't need it.
 * @param {object} params - The parameters.
 * @param {object} params.nodeDef - The code attribute node definition.
 * @param {object} params.parentNode - The parent node of the attribute being edited, if any.
 * @returns {object} The record, or null if it's not available yet.
 */
const useRecordOrFetchByParentNode = ({ nodeDef, parentNode }) => {
  const surveyId = useSelector(SurveyState.getSurveyId)
  const recordInState = useSelector(RecordState.getRecord)
  const recordInStateUuid = Record.getUuid(recordInState)
  const parentNodeRecordUuid = parentNode ? Node.getRecordUuid(parentNode) : null
  // recordInState can be a fully loaded record (record entry view) or a synthetic, nodes-only
  // record created on the fly by a node update in the Data Explorer (see actions/update.js and
  // Record.mergeNodes): the latter has no uuid and no ancestor nodes, so it cannot be used here.
  const isRecordInStateUsable =
    Boolean(recordInStateUuid) && (!parentNodeRecordUuid || recordInStateUuid === parentNodeRecordUuid)
  const needsParentCodeAttribute = Boolean(NodeDefs.getParentCodeDefUuid(nodeDef))
  const recordUuid =
    !isRecordInStateUsable && needsParentCodeAttribute && parentNode ? Node.getRecordUuid(parentNode) : null
  // Used only to force a re-render once the on-demand fetch resolves (its value is never read).
  const [, forceRenderAfterFetch] = useState(0)

  useEffect(() => {
    if (!recordUuid || getResolvedRecord(recordUuid)) return
    let cancelled = false
    fetchRecordAndNodesOnce({ surveyId, recordUuid }).then(() => {
      if (!cancelled) forceRenderAfterFetch((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [recordUuid, surveyId])

  if (isRecordInStateUsable) return recordInState
  return recordUuid ? (getResolvedRecord(recordUuid) ?? null) : null
}

export const useRecordParentCategoryItemUuid = ({ nodeDef, parentNode }) => {
  const record = useRecordOrFetchByParentNode({ nodeDef, parentNode })
  return useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    if (!record) return undefined
    const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    return Node.getCategoryItemUuid(nodeParentCode)
  })
}

export const useRecordCodeAttributesUuidsHierarchy = ({ nodeDef, parentNode }) => {
  const record = useRecordOrFetchByParentNode({ nodeDef, parentNode })
  return useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    if (!record) return []
    const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    return parentCodeAttribute ? [...Node.getHierarchyCode(parentCodeAttribute), Node.getUuid(parentCodeAttribute)] : []
  }, Objects.isEqual)
}

export const useIsRecordViewWithoutHeader = () => useSelector(RecordState.hasNoHeader)

const useNodesCount = ({ parentNodeUuid, nodeDefUuid, countType }) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
    const count = NodeDefs.getCount(nodeDef, countType)
    if (Objects.isEmpty(count)) return undefined
    if (Array.isArray(count)) {
      // count is an array of expressions
      const record = RecordState.getRecord(state)
      if (!record) return undefined
      const parentNode = Records.getNodeByUuid(parentNodeUuid)(record)
      return Nodes.getChildrenMinOrMaxCount({ parentNode, nodeDef, countType })
    }
    // count is constant value (backward compatibility)
    return Number(count)
  })

export const useNodesMaxCount = ({ parentNodeUuid, nodeDefUuid }) =>
  useNodesCount({ parentNodeUuid, nodeDefUuid, countType: NodeDefValidations.keys.max })

export const useNodesMinCount = ({ parentNodeUuid, nodeDefUuid }) =>
  useNodesCount({ parentNodeUuid, nodeDefUuid, countType: NodeDefValidations.keys.min })

export { useRecordPagesValidationProgress } from './useRecordPagesValidationProgress'
export { useRecordTreeItemStatus } from './useRecordTreeItemStatus'
