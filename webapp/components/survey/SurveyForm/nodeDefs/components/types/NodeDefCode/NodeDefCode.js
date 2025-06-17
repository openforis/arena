import './NodeDefCode.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Surveys } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Survey from '@core/survey/survey'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecordCodeAttributesUuidsHierarchy } from '@webapp/store/ui/record/hooks'

import NodeDefCodeCheckbox from './NodeDefCodeCheckbox'
import NodeDefCodeDropdown from './NodeDefCodeDropdown'
import { useItems } from './store'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

const NodeDefCode = (props) => {
  const {
    canEditRecord = false,
    edit = false,
    entryDataQuery = false,
    nodeDef,
    nodes = [],
    parentNode = null,
    readOnly: readOnlyProp = false,
    removeNode,
    updateNode,
  } = props

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const surveyInfo = Survey.getSurveyInfo(survey)
  const draft = Survey.isDraft(surveyInfo)

  const codeAttributesUuidsHierarchy = useRecordCodeAttributesUuidsHierarchy({ nodeDef, parentNode })
  const enumerator = Surveys.isNodeDefEnumerator({ survey, nodeDef })
  const readOnly = readOnlyProp || enumerator
  const singleNode = NodeDef.isSingle(nodeDef) || entryDataQuery

  const itemsNeeded = !readOnly && canEditRecord
  const items = useItems({ nodeDef, parentNode, draft, edit, entryDataQuery, itemsNeeded })
  const [selectedItems, setSelectedItems] = useState([])
  const autocomplete = typeof items === 'function'

  // On items or nodes change, update selectedItems
  useEffect(() => {
    if (!edit) {
      const selectedItemsUpdate = nodes.reduce((acc, node) => {
        const categoryItem = NodeRefData.getCategoryItem(node)
        if (categoryItem) {
          acc.push(categoryItem)
        }
        return acc
      }, [])
      setSelectedItems(selectedItemsUpdate)
    }
  }, [edit, items, nodes])

  const onItemAdd = useCallback(
    (item) => {
      const existingNode = singleNode ? nodes[0] : null
      const node = existingNode ?? Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)

      const value = Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item) })
      const meta = { [Node.metaKeys.hierarchyCode]: codeAttributesUuidsHierarchy }
      const refData = { [NodeRefData.keys.categoryItem]: item }

      updateNode(nodeDef, node, value, null, meta, refData)
    },
    [codeAttributesUuidsHierarchy, nodeDef, nodes, parentNode, singleNode, updateNode]
  )

  const onItemRemove = useCallback(
    (item) => {
      if (singleNode) {
        updateNode(nodeDef, nodes[0], {}, null, {}, {})
      } else {
        const nodeToRemove = nodes.find((node) => Node.getCategoryItemUuid(node) === CategoryItem.getUuid(item))
        removeNode(nodeDef, nodeToRemove)
      }
    },
    [nodeDef, nodes, removeNode, singleNode, updateNode]
  )

  const itemLabelFunction = useCallback(
    (item) =>
      NodeDefLayout.isCodeShown(surveyCycleKey)(nodeDef)
        ? CategoryItem.getLabelWithCode(lang)(item)
        : CategoryItem.getLabel(lang)(item),
    [lang, nodeDef, surveyCycleKey]
  )

  if (readOnly || !canEditRecord) {
    const nodesValueSummary = nodes
      .map((node) =>
        NodeValueFormatter.format({ survey, nodeDef, node, value: Node.getValue(node), showLabel: true, lang })
      )
      .join(', ')
    return <span className="value-preview">{nodesValueSummary}</span>
  }

  if (NodeDefLayout.isRenderDropdown(surveyCycleKey)(nodeDef) || entryDataQuery || autocomplete) {
    return (
      <NodeDefCodeDropdown
        canEditRecord={canEditRecord}
        edit={edit}
        entryDataQuery={entryDataQuery}
        itemLabelFunction={itemLabelFunction}
        items={items}
        nodeDef={nodeDef}
        onItemAdd={onItemAdd}
        onItemRemove={onItemRemove}
        readOnly={readOnly}
        selectedItems={selectedItems}
      />
    )
  }
  return (
    <NodeDefCodeCheckbox
      canEditRecord={canEditRecord}
      edit={edit}
      itemLabelFunction={itemLabelFunction}
      items={items}
      onItemAdd={onItemAdd}
      onItemRemove={onItemRemove}
      readOnly={readOnly}
      selectedItems={selectedItems}
    />
  )
}

NodeDefCode.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entryDataQuery: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.arrayOf(PropTypes.object),
  parentNode: PropTypes.object,
  readOnly: PropTypes.bool,
  removeNode: PropTypes.func.isRequired,
  updateNode: PropTypes.func.isRequired,
}

export default NodeDefCode
