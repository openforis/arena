import './nodeDefs.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState, useSurveyCycleKey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { RecordActions, RecordState } from '@webapp/store/ui/record'

import * as NodeDefUiProps from './nodeDefUIProps'

import { useNodeDefLabelType } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import NodeDefEditButtons from './components/nodeDefEditButtons'
import NodeDefTableCellBody from './components/nodeDefTableCellBody'
import NodeDefTableCellHeader from './components/nodeDefTableCellHeader'
import NodeDefFormItem from './components/NodeDefFormItem'

const _hasSiblingWithoutKeys = ({ survey, nodeDef, record, parentNode }) => {
  const keyDefs = Survey.getNodeDefKeys(nodeDef)(survey)
  if (Objects.isEmpty(keyDefs)) return false

  const siblings = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
  return (
    siblings.length > 0 &&
    siblings.some((sibling) => {
      const keyValues = Record.getEntityKeyValues(survey, sibling)(record)
      return keyValues.every((keyValue) => Objects.isEmpty(keyValue))
    })
  )
}

const _maxCountReached = ({ nodeDef, nodes }) => {
  const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)

  if (Objects.isEmpty(maxCount)) return false

  return nodes.length === Number(maxCount)
}

const useEntryProps = ({ canEditRecord, entry, nodeDef, parentNode }) =>
  useSelector((state) => {
    const record = RecordState.getRecord(state)
    const rootNode = record ? Record.getRootNode(record) : null
    if (!entry || !record || !rootNode) return {}

    const survey = SurveyState.getSurvey(state)

    const nodes = NodeDef.isRoot(nodeDef)
      ? [rootNode]
      : parentNode
        ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
        : []

    const canAddNode =
      canEditRecord &&
      parentNode &&
      NodeDef.isMultiple(nodeDef) &&
      !NodeDef.isEnumerate(nodeDef) &&
      !_maxCountReached({ nodeDef, nodes }) &&
      !_hasSiblingWithoutKeys({ survey, nodeDef, record, parentNode })

    const nodesEmpty = nodes.every((node) => Record.isNodeEmpty(node)(record))
    const readOnly = NodeDef.isReadOnlyOrAnalysis(nodeDef)
    return {
      nodes,
      nodesEmpty,
      canAddNode,
      readOnly,
    }
  }, Objects.isEqual)

const NodeDefSwitch = (props) => {
  const { canEditDef, canEditRecord, edit, empty, entry, nodeDef, parentNode, renderType } = props

  const dispatch = useDispatch()
  const elementRef = useRef(null)

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const nodeDefLabelType = useNodeDefLabelType()
  const lang = useSurveyPreferredLang()
  const label = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })

  const [isHovering, setIsHovering] = useState(false)

  const renderAsForm = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const editButtonsVisible = edit && canEditDef && (renderAsForm || isHovering)

  const updateNode = useCallback((...params) => dispatch(RecordActions.updateNode(...params)), [])
  const removeNode = useCallback((...params) => dispatch(RecordActions.removeNode(...params)), [])
  const createNodePlaceholder = useCallback((...params) => dispatch(RecordActions.createNodePlaceholder(...params)), [])

  const entryProps = useEntryProps({ canEditRecord, entry, nodeDef, parentNode })

  const applicable = parentNode ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode) : true
  const { canAddNode, nodes } = entryProps

  const className = classNames(
    'survey-form__node-def-page' + (NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item'),
    {
      'not-applicable': !applicable,
      hidden:
        !applicable &&
        NodeDefLayout.isHiddenWhenNotRelevant(surveyCycleKey)(nodeDef) &&
        renderType !== NodeDefLayout.renderType.tableBody &&
        empty,
      'read-only': NodeDef.isReadOnly(nodeDef) && renderType !== NodeDefLayout.renderType.tableHeader,
    }
  )

  const checkNodePlaceholder = useCallback(() => {
    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, NodeDefUiProps.getDefaultValue(nodeDef))
    }
  }, [canAddNode, createNodePlaceholder, nodeDef, nodes, parentNode])

  useEffect(() => {
    if (edit && !nodeDef.id) {
      elementRef.current.scrollIntoView()
    }
    checkNodePlaceholder()
  }, [checkNodePlaceholder, edit, nodeDef])

  const _setIsHovering = useCallback(
    (isHovering) => {
      if (edit && canEditDef) {
        setIsHovering(isHovering)
      }
    },
    [canEditDef, edit]
  )

  const onMouseEnter = useCallback(() => {
    if (!isHovering) {
      _setIsHovering(true)
    }
  }, [_setIsHovering, isHovering])

  const onMouseLeave = useCallback(() => {
    _setIsHovering(false)
  }, [_setIsHovering])

  const propagatedProps = {
    ...props,
    ...entryProps,
    surveyInfo,
    label,
    lang,
    updateNode,
    removeNode,
  }

  return (
    <div
      className={className}
      data-testid={TestId.surveyForm.nodeDefWrapper(NodeDef.getName(nodeDef))}
      ref={elementRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseEnter}
    >
      {editButtonsVisible && (
        <NodeDefEditButtons surveyCycleKey={surveyCycleKey} nodeDef={nodeDef} edit={edit} canEditDef={canEditDef} />
      )}
      {renderType === NodeDefLayout.renderType.tableHeader ? (
        <NodeDefTableCellHeader nodeDef={nodeDef} label={label} lang={lang} />
      ) : renderType === NodeDefLayout.renderType.tableBody ? (
        <NodeDefTableCellBody {...propagatedProps} />
      ) : (
        <NodeDefFormItem {...propagatedProps} />
      )}
    </div>
  )
}

export default NodeDefSwitch
