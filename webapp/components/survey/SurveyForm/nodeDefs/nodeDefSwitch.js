import './nodeDefs.scss'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Nodes, Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
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

const _isNodesCountAboveMin = ({ parentNode, nodeDef, nodes }) => {
  const minCount = Nodes.getChildrenMinCount({ parentNode, nodeDef })
  return Objects.isEmpty(minCount) || nodes.length > Number(minCount)
}

const _isNodesCountBelowMax = ({ parentNode, nodeDef, nodes }) => {
  const maxCount = Nodes.getChildrenMaxCount({ parentNode, nodeDef })
  return Objects.isEmpty(maxCount) || nodes.length < Number(maxCount)
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

    const canAddOrDeleteNodeCommon =
      canEditRecord && parentNode && NodeDef.isMultiple(nodeDef) && !NodeDef.isEnumerate(nodeDef)

    const canAddNode =
      canAddOrDeleteNodeCommon &&
      _isNodesCountBelowMax({ parentNode, nodeDef, nodes }) &&
      !_hasSiblingWithoutKeys({ survey, nodeDef, record, parentNode })

    const canDeleteNode = canAddOrDeleteNodeCommon && _isNodesCountAboveMin({ parentNode, nodeDef, nodes })

    const nodesEmpty = nodes.every((node) => Record.isNodeEmpty(node)(record))

    return {
      nodes,
      nodesEmpty,
      canAddNode,
      canDeleteNode,
    }
  }, Objects.isEqual)

const NodeDefSwitch = (props) => {
  const { canEditDef, canEditRecord, edit, empty, entry, nodeDef, parentNode, renderType } = props

  const dispatch = useDispatch()
  const containerRef = useRef(null)

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const nodeDefLabelType = useNodeDefLabelType()
  const lang = useSurveyPreferredLang()
  const label = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
  const readOnly = NodeDef.isReadOnlyOrAnalysis(nodeDef)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const [isHovering, setIsHovering] = useState(false)
  const [keyFieldEditingNodeDefUuid, setKeyFieldEditingNodeDefUuid] = useState(null)
  const [keyFieldUnlockedNodeDefUuid, setKeyFieldUnlockedNodeDefUuid] = useState(null)

  const renderAsForm = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const editButtonsVisible = edit && canEditDef && (renderAsForm || isHovering)
  const handleMouseEvents = edit && canEditDef && !renderAsForm

  const updateNode = useCallback((...params) => dispatch(RecordActions.updateNode(...params)), [dispatch])
  const removeNode = useCallback((...params) => dispatch(RecordActions.removeNode(...params)), [dispatch])
  const createNodePlaceholder = useCallback(
    (...params) => dispatch(RecordActions.createNodePlaceholder(...params)),
    [dispatch]
  )

  const entryProps = useEntryProps({ canEditRecord, entry, nodeDef, parentNode })

  const applicable = parentNode ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode) : true
  const { canAddNode, nodes, nodesEmpty } = entryProps
  const isKeyFieldLockEnabled =
    entry && !edit && canEditRecord && NodeDef.isAttribute(nodeDef) && NodeDef.isKey(nodeDef)
  const keyNodeHasValue = isKeyFieldLockEnabled && entry && !nodesEmpty
  const isKeyFieldEditing = keyFieldEditingNodeDefUuid === nodeDefUuid
  const keyFieldUnlocked = keyFieldUnlockedNodeDefUuid === nodeDefUuid
  const keyFieldLocked = isKeyFieldLockEnabled && keyNodeHasValue && !keyFieldUnlocked && !isKeyFieldEditing

  const mainClassNameSuffix = NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item'
  const mainClassName = 'survey-form__node-def-page' + mainClassNameSuffix

  const className = classNames(mainClassName, {
    'not-applicable': !applicable,
    hidden:
      !applicable &&
      NodeDefLayout.isHiddenWhenNotRelevant(surveyCycleKey)(nodeDef) &&
      renderType !== NodeDefLayout.renderType.tableBody &&
      empty,
    'read-only': (readOnly || keyFieldLocked) && renderType !== NodeDefLayout.renderType.tableHeader,
  })

  const checkNodePlaceholder = useCallback(() => {
    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, NodeDefUiProps.getDefaultValue(nodeDef))
    }
  }, [canAddNode, createNodePlaceholder, nodeDef, nodes, parentNode])

  useEffect(() => {
    if (edit && !nodeDef.id) {
      containerRef.current.scrollIntoView()
    }
    checkNodePlaceholder()
  }, [checkNodePlaceholder, edit, nodeDef])

  // scroll to top on nodeDef change
  useEffect(() => {
    const containerEl = containerRef.current
    if (containerEl) {
      containerEl.scrollTop = 0
    }
  }, [nodeDefUuid])

  const setHovering = (hovering) => {
    if (edit && canEditDef) {
      setIsHovering(hovering)
    }
  }

  const onMouseEnter = () => {
    if (!isHovering) {
      setHovering(true)
    }
  }

  const onMouseLeave = () => {
    setHovering(false)
  }

  const onKeyFieldFocus = () => {
    if (isKeyFieldLockEnabled) {
      setKeyFieldEditingNodeDefUuid(nodeDefUuid)
    }
  }

  const onKeyFieldBlur = (event) => {
    if (!isKeyFieldLockEnabled) return

    if (event.currentTarget.contains(event.relatedTarget)) return

    setKeyFieldEditingNodeDefUuid(null)
    if (keyNodeHasValue) {
      setKeyFieldUnlockedNodeDefUuid(null)
    }
  }

  const onKeyFieldLockToggle = () => {
    if (!isKeyFieldLockEnabled || !keyNodeHasValue) return

    if (keyFieldLocked) {
      setKeyFieldUnlockedNodeDefUuid(nodeDefUuid)
      return
    }

    setKeyFieldEditingNodeDefUuid(null)
    setKeyFieldUnlockedNodeDefUuid(null)
  }

  const nestedComponentsProps = {
    ...props,
    ...entryProps,
    surveyInfo,
    readOnly: readOnly || keyFieldLocked,
    label,
    lang,
    createNodePlaceholder,
    updateNode,
    removeNode,
    keyFieldLocked,
    keyFieldLockVisible: isKeyFieldLockEnabled && keyNodeHasValue,
    onKeyFieldFocus,
    onKeyFieldBlur,
    onKeyFieldLockToggle,
  }

  return (
    <div
      className={className}
      data-testid={TestId.surveyForm.nodeDefWrapper(NodeDef.getName(nodeDef))}
      ref={containerRef}
      onMouseEnter={handleMouseEvents ? onMouseEnter : undefined}
      onMouseLeave={handleMouseEvents ? onMouseLeave : undefined}
      onMouseMove={handleMouseEvents ? onMouseEnter : undefined}
    >
      {editButtonsVisible && (
        <NodeDefEditButtons surveyCycleKey={surveyCycleKey} nodeDef={nodeDef} edit={edit} canEditDef={canEditDef} />
      )}
      {renderType === NodeDefLayout.renderType.tableHeader ? (
        <NodeDefTableCellHeader nodeDef={nodeDef} label={label} lang={lang} />
      ) : renderType === NodeDefLayout.renderType.tableBody ? (
        <NodeDefTableCellBody {...nestedComponentsProps} />
      ) : (
        <NodeDefFormItem {...nestedComponentsProps} />
      )}
    </div>
  )
}

NodeDefSwitch.propTypes = {
  canEditDef: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  empty: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  parentNode: PropTypes.object,
  preview: PropTypes.bool,
  renderType: PropTypes.string,
}

export default NodeDefSwitch
