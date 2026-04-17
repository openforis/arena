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

    const nodesHaveValue = nodes.length > 0 && nodes.every((node) => Nodes.isValueNotBlank(node))
    const nodesEmpty = nodes.every((node) => Record.isNodeEmpty(node)(record))

    return {
      nodes,
      nodesEmpty,
      nodesHaveValue,
      canAddNode,
      canDeleteNode,
    }
  }, Objects.isEqual)

const useHovering = ({ canEditDef, edit }) => {
  const [isHovering, setIsHovering] = useState(false)

  const onMouseEnter = () => {
    if (edit && canEditDef && !isHovering) {
      setIsHovering(true)
    }
  }

  const onMouseLeave = () => {
    setIsHovering(false)
  }

  return {
    isHovering,
    onMouseEnter,
    onMouseLeave,
  }
}

const useKeyFieldLock = ({ canEditRecord, edit, entry, nodeDef, nodeDefUuid, nodesHaveValue }) => {
  const [editingNodeDefUuid, setEditingNodeDefUuid] = useState(null)
  const [unlockedNodeDefUuid, setUnlockedNodeDefUuid] = useState(null)

  const lockEnabled = entry && !edit && canEditRecord && NodeDef.isAttribute(nodeDef) && NodeDef.isKey(nodeDef)
  const hasValue = lockEnabled && nodesHaveValue
  const isEditing = editingNodeDefUuid === nodeDefUuid
  const isUnlocked = unlockedNodeDefUuid === nodeDefUuid
  const isLocked = lockEnabled && hasValue && !isUnlocked && !isEditing

  const onFocus = useCallback(() => {
    if (lockEnabled) {
      setEditingNodeDefUuid(nodeDefUuid)
    }
  }, [lockEnabled, nodeDefUuid])

  const onBlur = useCallback(
    (event) => {
      if (!lockEnabled || event.currentTarget.contains(event.relatedTarget)) return

      setEditingNodeDefUuid(null)
      if (hasValue) {
        setUnlockedNodeDefUuid(null)
      }
    },
    [lockEnabled, hasValue]
  )

  const onLockToggle = useCallback(() => {
    if (!lockEnabled || !hasValue) return

    if (isLocked) {
      setUnlockedNodeDefUuid(nodeDefUuid)
      return
    }

    setEditingNodeDefUuid(null)
    setUnlockedNodeDefUuid(null)
  }, [lockEnabled, hasValue, isLocked, nodeDefUuid])

  return {
    hasValue,
    isLocked,
    lockVisible: lockEnabled && hasValue,
    onFocus,
    onBlur,
    onLockToggle,
  }
}

const getClassName = ({ applicable, empty, keyFieldLocked, nodeDef, readOnly, renderType, surveyCycleKey }) => {
  const mainClassNameSuffix = NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item'
  const mainClassName = 'survey-form__node-def-page' + mainClassNameSuffix

  return classNames(mainClassName, {
    'not-applicable': !applicable,
    hidden:
      !applicable &&
      NodeDefLayout.isHiddenWhenNotRelevant(surveyCycleKey)(nodeDef) &&
      renderType !== NodeDefLayout.renderType.tableBody &&
      empty,
    'key-field-locked': keyFieldLocked && renderType !== NodeDefLayout.renderType.tableHeader,
    'read-only': (readOnly || keyFieldLocked) && renderType !== NodeDefLayout.renderType.tableHeader,
  })
}

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

  const renderAsForm = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const handleMouseEvents = edit && canEditDef && !renderAsForm

  const updateNode = useCallback((...params) => dispatch(RecordActions.updateNode(...params)), [dispatch])
  const removeNode = useCallback((...params) => dispatch(RecordActions.removeNode(...params)), [dispatch])
  const createNodePlaceholder = useCallback(
    (...params) => dispatch(RecordActions.createNodePlaceholder(...params)),
    [dispatch]
  )

  const entryProps = useEntryProps({ canEditRecord, entry, nodeDef, parentNode })

  const applicable = parentNode ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode) : true
  const { canAddNode, nodes, nodesHaveValue } = entryProps
  const { isHovering, onMouseEnter, onMouseLeave } = useHovering({ canEditDef, edit })
  const {
    isLocked: keyFieldLocked,
    lockVisible: keyFieldLockVisible,
    onFocus: onKeyFieldFocus,
    onBlur: onKeyFieldBlur,
    onLockToggle: onKeyFieldLockToggle,
  } = useKeyFieldLock({
    canEditRecord,
    edit,
    entry,
    nodeDef,
    nodeDefUuid,
    nodesHaveValue,
  })
  const editButtonsVisible = edit && canEditDef && (renderAsForm || isHovering)

  const className = getClassName({
    applicable,
    empty,
    keyFieldLocked,
    nodeDef,
    readOnly,
    renderType,
    surveyCycleKey,
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
    keyFieldLockVisible,
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
