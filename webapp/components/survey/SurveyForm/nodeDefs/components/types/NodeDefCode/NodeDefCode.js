import './NodeDefCode.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

import NodeDefCodeCheckbox from './NodeDefCodeCheckbox'
import NodeDefCodeDropdown from './NodeDefCodeDropdown'

const NodeDefCode = (props) => {
  const { canEditRecord, edit, entryDataQuery, nodeDef, nodes, parentNode, readOnly, removeNode, updateNode } = props

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const record = useSelector(RecordState.getRecord)

  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyId = Survey.getId(survey)
  const draft = Survey.isDraft(surveyInfo)
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const nodeParentCodeUuid = Node.getCategoryItemUuid(nodeParentCode)
  const codeUuidsHierarchy = nodeParentCode
    ? R.append(Node.getUuid(nodeParentCode), Node.getHierarchyCode(nodeParentCode))
    : []

  const [items, setItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const itemsArray = Object.values(items)

  // Fetch code items on categoryUuid or nodeParentCodeUuid update
  useEffect(() => {
    if (!edit) {
      ;(async () => {
        const itemsLoaded =
          categoryUuid && (nodeParentCodeUuid || categoryLevelIndex === 0)
            ? await API.fetchCategoryItems({ surveyId, categoryUuid, draft, parentUuid: nodeParentCodeUuid })
            : []
        setItems(itemsLoaded)
      })()
    }
  }, [edit, categoryUuid, nodeParentCodeUuid])

  // On items or nodes change, update selectedItems
  useEffect(() => {
    if (!edit) {
      const selectedItemUuids = nodes.map(Node.getCategoryItemUuid)
      const selectedItemsUpdate = itemsArray.filter((item) => selectedItemUuids.includes(CategoryItem.getUuid(item)))
      setSelectedItems(selectedItemsUpdate)
    }
  }, [edit, items, nodes])

  const onItemAdd = (item) => {
    const node =
      NodeDef.isSingle(nodeDef) || entryDataQuery
        ? nodes[0]
        : Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)

    const value = { [Node.valuePropKeys.itemUuid]: CategoryItem.getUuid(item) }
    const meta = { [Node.metaKeys.hierarchyCode]: codeUuidsHierarchy }
    const refData = { [NodeRefData.keys.categoryItem]: item }

    updateNode(nodeDef, node, value, null, meta, refData)
  }

  const onItemRemove = (item) => {
    if (NodeDef.isSingle(nodeDef) || entryDataQuery) {
      updateNode(nodeDef, nodes[0], {}, null, {}, {})
    } else {
      const nodeToRemove = nodes.find((node) => Node.getCategoryItemUuid(node) === CategoryItem.getUuid(item))
      removeNode(nodeDef, nodeToRemove)
    }
  }

  return NodeDefLayout.isRenderDropdown(surveyCycleKey)(nodeDef) || entryDataQuery ? (
    <NodeDefCodeDropdown
      canEditRecord={canEditRecord}
      edit={edit}
      entryDataQuery={entryDataQuery}
      items={itemsArray}
      nodeDef={nodeDef}
      onItemAdd={onItemAdd}
      onItemRemove={onItemRemove}
      readOnly={readOnly}
      selectedItems={selectedItems}
    />
  ) : (
    <NodeDefCodeCheckbox
      canEditRecord={canEditRecord}
      edit={edit}
      items={itemsArray}
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

NodeDefCode.defaultProps = {
  canEditRecord: false,
  edit: false,
  entryDataQuery: false,
  nodes: [],
  parentNode: null,
  readOnly: false,
}

export default NodeDefCode
