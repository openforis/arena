import './nodeDefs.scss'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import * as A from '@core/arena'
import classNames from 'classnames'

import { RecordNodes, Objects, type ArenaAnyNodeDef, type ArenaRecordNode } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import {
  SurveyState,
  useIsNodeDefEnumerator,
  useSurveyCycleKey,
  useSurveyInfo,
  useSurveyPreferredLang,
} from '@webapp/store/survey'
import { useAuthCanEditQualifierAttributeValue } from '@webapp/store/user'
import { RecordActions, RecordState } from '@webapp/store/ui/record'

import * as NodeDefUiProps from './nodeDefUIProps'

import { useNodeDefLabelType } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import NodeDefEditButtons from './components/NodeDefEditButtons'
import NodeDefTableCellBody from './components/NodeDefTableCellBody'
import NodeDefTableCellHeader from './components/NodeDefTableCellHeader'
import NodeDefFormItem from './components/NodeDefFormItem'
import { useAppDispatch } from '@webapp/store'

const _hasSiblingWithoutKeys = ({ survey, nodeDef, record, parentNode }) => {
  const keyDefs = Survey.getNodeDefKeys(nodeDef)(survey)
  if (Objects.isEmpty(keyDefs)) return false

  const siblings = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
  return siblings.some((sibling) => {
    const keyValues = Record.getEntityKeyValues(survey, sibling)(record)
    return keyValues.every((keyValue) => Objects.isEmpty(keyValue))
  })
}

const _isNodesCountAboveMin = ({ parentNode, nodeDef, nodes }) => {
  const minCount = RecordNodes.getChildrenMinCount({ parentNode, nodeDef })
  return Objects.isEmpty(minCount) || nodes.length > Number(minCount)
}

const _isNodesCountBelowMax = ({ parentNode, nodeDef, nodes }) => {
  const maxCount = RecordNodes.getChildrenMaxCount({ parentNode, nodeDef })
  return Objects.isEmpty(maxCount) || nodes.length < Number(maxCount)
}

const useEntryProps = ({ canEditRecord, entry, nodeDef, parentNode, editable }) =>
  useSelector((state) => {
    const record = RecordState.getRecord(state)
    const rootNode = record ? Record.getRootNode(record) : null
    if (!entry || !record || !rootNode) return {}

    const survey = SurveyState.getSurvey(state)

    let nodes = []
    if (NodeDef.isRoot(nodeDef)) {
      nodes = [rootNode]
    } else if (parentNode) {
      nodes = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
    }

    const canAddOrDeleteNodeCommon =
      editable && canEditRecord && parentNode && NodeDef.isMultiple(nodeDef) && !NodeDef.isEnumerate(nodeDef)

    const canAddNode =
      canAddOrDeleteNodeCommon &&
      _isNodesCountBelowMax({ parentNode, nodeDef, nodes }) &&
      !_hasSiblingWithoutKeys({ survey, nodeDef, record, parentNode })

    const canDeleteNode = canAddOrDeleteNodeCommon && _isNodesCountAboveMin({ parentNode, nodeDef, nodes })

    const nodesHaveValue = nodes.length > 0 && nodes.every((node) => RecordNodes.isValueNotBlank(node))
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

// Shared by useKeyFieldLock and useQualifierFieldLock: once a field holds a value it starts out
// locked (read-only) to prevent accidental edits; the user can unlock it for the current focus
// session via the lock toggle button.
const useAttributeFieldLock = ({ nodeDef, lockEnabled, hasValue }) => {
  const [editingNodeDefUuid, setEditingNodeDefUuid] = useState(null)
  const [unlockedNodeDefUuid, setUnlockedNodeDefUuid] = useState(null)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

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
    isLocked,
    lockVisible: lockEnabled && hasValue,
    onFocus,
    onBlur,
    onLockToggle,
  }
}

const useKeyFieldLock = ({ canEditRecord, edit, entry, nodeDef, isNodeDefEnumerator, nodesHaveValue }) => {
  const lockEnabled =
    entry && !edit && canEditRecord && NodeDef.isAttribute(nodeDef) && NodeDef.isKey(nodeDef) && !isNodeDefEnumerator
  return useAttributeFieldLock({ nodeDef, lockEnabled, hasValue: nodesHaveValue })
}

// Qualifier attribute values are auto-filled by the system based on the user's group and, unlike key
// attributes, are read-only for every user once applied (see recordQualifierMatcher.js); survey admins
// are the only ones allowed to correct them, and only after explicitly unlocking the field.
const useQualifierFieldLock = ({ canEditQualifierValue, edit, entry, nodeDef, qualifierValueApplied }) => {
  const lockEnabled =
    entry && !edit && canEditQualifierValue && NodeDef.isAttribute(nodeDef) && NodeDef.isQualifier(nodeDef)
  return useAttributeFieldLock({ nodeDef, lockEnabled, hasValue: qualifierValueApplied })
}

const getClassName = ({
  applicable,
  empty,
  keyFieldLocked,
  nodeDef,
  qualifierFieldLocked,
  readOnly,
  renderType,
  surveyCycleKey,
}) => {
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
    'qualifier-field-locked': qualifierFieldLocked && renderType !== NodeDefLayout.renderType.tableHeader,
    'read-only':
      (readOnly || keyFieldLocked || qualifierFieldLocked) && renderType !== NodeDefLayout.renderType.tableHeader,
  })
}

type NodeDefBodyProps = {
  nestedComponentsProps: any
  renderType: string
}

const NodeDefBody = ({ renderType, nestedComponentsProps }: NodeDefBodyProps) =>
  renderType === NodeDefLayout.renderType.tableBody ? (
    <NodeDefTableCellBody {...nestedComponentsProps} />
  ) : (
    <NodeDefFormItem {...nestedComponentsProps} />
  )

type NodeDefSwitchProps = {
  canEditDef?: boolean
  canEditRecord?: boolean
  edit?: boolean
  empty?: boolean
  entry?: boolean
  nodeDef: ArenaAnyNodeDef
  onSortBy?: (...args: any[]) => any
  parentNode?: ArenaRecordNode
  preview?: boolean
  readOnly?: boolean
  renderType?: string
  sortCriteria?: any[]
  // other props are passed through to the node def component
  [key: string]: any
}

const NodeDefSwitch = (props: NodeDefSwitchProps) => {
  const {
    canEditDef,
    canEditRecord,
    edit,
    empty,
    entry,
    nodeDef,
    onSortBy,
    parentNode,
    preview,
    readOnly: readOnlyProp,
    renderType,
    sortCriteria = [],
  } = props

  const dispatch = useAppDispatch()
  const containerRef = useRef(null)

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const nodeDefLabelType = useNodeDefLabelType()
  const isNodeDefEnumerator = useIsNodeDefEnumerator(nodeDef)
  const canEditQualifierValue = useAuthCanEditQualifierAttributeValue()
  const lang = useSurveyPreferredLang()
  const label = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })
  const readOnly = NodeDef.isReadOnlyOrAnalysis(nodeDef)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const renderAsForm = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const handleMouseEvents = edit && canEditDef && !renderAsForm

  const updateNode = useCallback(
    (nodeDef, node, value, file = null, meta = {}, refData = null) =>
      dispatch(RecordActions.updateNode(nodeDef, node, value, file, meta, refData)),
    [dispatch]
  )
  const removeNode = useCallback((nodeDef, node) => dispatch(RecordActions.removeNode(nodeDef, node)), [dispatch])
  const createNodePlaceholder = useCallback(
    (nodeDef, parentNode, defaultValue) =>
      dispatch(RecordActions.createNodePlaceholder(nodeDef, parentNode, defaultValue)),
    [dispatch]
  )

  const editable = parentNode ? Node.isChildEditable(nodeDefUuid)(parentNode) : true

  const entryProps = useEntryProps({ canEditRecord, entry, nodeDef, parentNode, editable })

  const qualifierValueApplied = Boolean(entryProps.nodes?.[0] && Node.isQualifierValueApplied(entryProps.nodes[0]))

  const applicable = parentNode ? Node.isChildApplicable(nodeDefUuid)(parentNode) : true

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
    isNodeDefEnumerator,
    nodesHaveValue,
  })
  const {
    isLocked: qualifierFieldLocked,
    lockVisible: qualifierFieldLockVisible,
    onFocus: onQualifierFieldFocus,
    onBlur: onQualifierFieldBlur,
    onLockToggle: onQualifierFieldLockToggle,
  } = useQualifierFieldLock({
    canEditQualifierValue,
    edit,
    entry,
    nodeDef,
    qualifierValueApplied,
  })
  const editButtonsVisible = edit && canEditDef && (renderAsForm || isHovering)

  const className = getClassName({
    applicable,
    empty,
    keyFieldLocked,
    nodeDef,
    qualifierFieldLocked,
    readOnly,
    renderType,
    surveyCycleKey,
  })

  const checkNodePlaceholder = useCallback(() => {
    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && A.none(Node.isPlaceholder, nodes)) {
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

  // the nodes of the attributes of a new entity are created server side: until they arrive, there is no node to update
  const attributeNodeMissing =
    entry && NodeDef.isAttribute(nodeDef) && NodeDef.isSingle(nodeDef) && A.isEmpty(nodes ?? [])

  const nestedComponentsProps = {
    ...props,
    ...entryProps,
    preview,
    surveyInfo,
    readOnly:
      readOnlyProp ||
      readOnly ||
      attributeNodeMissing ||
      keyFieldLocked ||
      !editable ||
      qualifierFieldLocked ||
      (qualifierValueApplied && !canEditQualifierValue),
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
    qualifierFieldLocked,
    qualifierFieldLockVisible,
    onQualifierFieldFocus,
    onQualifierFieldBlur,
    onQualifierFieldLockToggle,
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
      {editButtonsVisible && <NodeDefEditButtons surveyCycleKey={surveyCycleKey} nodeDef={nodeDef} />}
      {renderType === NodeDefLayout.renderType.tableHeader ? (
        <NodeDefTableCellHeader
          nodeDef={nodeDef}
          label={label}
          lang={lang}
          sortCriteria={sortCriteria}
          onSortBy={onSortBy}
        />
      ) : (
        <NodeDefBody renderType={renderType} nestedComponentsProps={nestedComponentsProps} />
      )}
    </div>
  )
}

export default NodeDefSwitch
