import './nodeDefCode.scss'

import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import NodeDefCodeDropdown from './nodeDefCodeDropdown'
import NodeDefCodeCheckbox from './nodeDefCodeCheckbox'
import { useAsyncGetRequest } from '@webapp/commonComponents/hooks'

import NodeDef from '@core/survey/nodeDef'
import Survey from '@core/survey/survey'
import Category from '@core/survey/category'
import CategoryItem from '@core/survey/categoryItem'
import Record from '@core/record/record'
import Node from '@core/record/node'
import NodeRefData from '@core/record/nodeRefData'
import NodeDefLayout from '@core/survey/nodeDefLayout'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordState from '../../../../record/recordState'

const NodeDefCode = props => {

  const {
    surveyId, surveyCycleKey, nodeDef,
    categoryUuid, categoryLevelIndex, nodeParentCodeUuid, codeUuidsHierarchy,
    parentNode, nodes,
    edit, draft, entryDataQuery,
    updateNode, removeNode,
  } = props

  const { data: { items = [] } = { items: [] }, dispatch: fetchItems, setState: setItems } = useAsyncGetRequest(
    `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
    { params: { draft, parentUuid: nodeParentCodeUuid } }
  )
  const itemsArray = Object.values(items)
  const [selectedItems, setSelectedItems] = useState([])

  if (!edit) {

    // fetch code items on categoryUuid or nodeParentCodeUuid update
    useEffect(() => {
      if (categoryUuid && (nodeParentCodeUuid || categoryLevelIndex === 0))
        fetchItems()
      else
        setItems({ data: { items: [] } })
    }, [categoryUuid, nodeParentCodeUuid])

    // on items or nodes change, update selectedItems
    useEffect(() => {
      const selectedItemUuids = nodes.map(Node.getCategoryItemUuid)
      const selectedItemsUpdate = itemsArray.filter(item => selectedItemUuids.includes(CategoryItem.getUuid(item)))
      setSelectedItems(selectedItemsUpdate)
    }, [items, nodes])

  }

  const onItemAdd = item => {
    const node = NodeDef.isSingle(nodeDef) || entryDataQuery
      ? nodes[0]
      : Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)

    const value = { [Node.valuePropKeys.itemUuid]: CategoryItem.getUuid(item) }
    const meta = { [Node.metaKeys.hierarchyCode]: codeUuidsHierarchy }
    const refData = { [NodeRefData.keys.categoryItem]: item }

    updateNode(nodeDef, node, value, null, meta, refData)
  }

  const onItemRemove = item => {
    if (NodeDef.isSingle(nodeDef) || entryDataQuery) {
      updateNode(nodeDef, nodes[0], {}, null, {}, {})
    } else {
      const nodeToRemove = nodes.find(node => Node.getCategoryItemUuid(node) === CategoryItem.getUuid(item))
      removeNode(nodeDef, nodeToRemove)
    }
  }

  return NodeDefLayout.isRenderDropdown(surveyCycleKey)(nodeDef) || entryDataQuery
    ? (
      <NodeDefCodeDropdown
        {...props}
        items={itemsArray}
        selectedItems={selectedItems}
        onItemAdd={onItemAdd}
        onItemRemove={onItemRemove}
      />
    )
    : (
      <NodeDefCodeCheckbox
        {...props}
        items={itemsArray}
        selectedItems={selectedItems}
        onItemAdd={onItemAdd}
        onItemRemove={onItemRemove}
      />
    )
}

const mapStateToProps = (state, props) => {
  const lang = AppState.getLang(state)

  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  const record = RecordState.getRecord(state)
  const { nodeDef, parentNode } = props

  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

  const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)

  const codeUuidsHierarchy = nodeParentCode
    ? R.append(Node.getUuid(nodeParentCode), Node.getHierarchyCode(nodeParentCode))
    : []

  return {
    lang,

    surveyId: Survey.getId(survey),
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    draft: Survey.isDraft(surveyInfo),

    parentCodeDefUuid: NodeDef.getParentCodeDefUuid(nodeDef),
    categoryUuid: category ? Category.getUuid(category) : null,
    categoryLevelIndex: categoryLevelIndex,
    nodeParentCodeUuid: Node.getCategoryItemUuid(nodeParentCode),
    codeUuidsHierarchy
  }
}

export default connect(mapStateToProps)(NodeDefCode)
