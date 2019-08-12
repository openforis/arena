import './nodeDefCode.scss'

import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import NodeDefCodeDropdown from './nodeDefCodeDropdown'
import NodeDefCodeCheckbox from './nodeDefCodeCheckbox'
import { useAsyncGetRequest } from '../../../../../../commonComponents/hooks'

import Survey from '../../../../../../../common/survey/survey'
import NodeDef from '../../../../../../../common/survey/nodeDef'
import Category from '../../../../../../../common/survey/category'
import CategoryItem from '../../../../../../../common/survey/categoryItem'
import Record from '../../../../../../../common/record/record'
import Node from '../../../../../../../common/record/node'
import NodeRefData from '../../../../../../../common/record/nodeRefData'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'

import * as AppState from '../../../../../../app/appState'
import * as SurveyState from '../../../../../../survey/surveyState'
import * as RecordState from '../../../../record/recordState'

const NodeDefCode = props => {

  const {
    surveyId, nodeDef,
    categoryUuid, categoryLevelIndex, nodeParentCodeUuid, codeUuidsHierarchy,
    parentNode, nodes,
    edit, draft,
    updateNode, removeNode,
  } = props

  const { data: { items = [] } = { items: [] }, dispatch: fetchItems, setState: setItems } = useAsyncGetRequest(
    `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
    { params: { draft, parentUuid: nodeParentCodeUuid } }
  )
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
      const selectedItemsUpdate = items.filter(item => selectedItemUuids.includes(CategoryItem.getUuid(item)))
      setSelectedItems(selectedItemsUpdate)
    }, [items, nodes])

  }

  const onItemAdd = item => {
    const node = NodeDef.isSingle(nodeDef)
      ? nodes[0]
      : Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)

    const value = { [Node.valuePropKeys.itemUuid]: CategoryItem.getUuid(item) }
    const meta = { [Node.metaKeys.hierarchyCode]: codeUuidsHierarchy }
    const refData = { [NodeRefData.keys.categoryItem]: item }

    updateNode(nodeDef, node, value, null, meta, refData)
  }

  const onItemRemove = item => {
    if (NodeDef.isSingle(nodeDef)) {
      // do not update node if it has a "simple" default value
      if (!NodeDef.hasDefaultValueSimple(nodeDef)) {
        updateNode(nodeDef, nodes[0], {}, null, {}, {})
      }
    } else if (nodes.length > 1 || !NodeDef.hasDefaultValueSimple(nodeDef)) {
      const nodeToRemove = nodes.find(node => Node.getCategoryItemUuid(node) === CategoryItem.getUuid(item))
      removeNode(nodeDef, nodeToRemove)
    }
  }

  return NodeDefLayout.isRenderDropdown(nodeDef)
    ? (
      <NodeDefCodeDropdown
        {...props}
        items={items}
        selectedItems={selectedItems}
        onItemAdd={onItemAdd}
        onItemRemove={onItemRemove}
      />
    )
    : (
      <NodeDefCodeCheckbox
        {...props}
        items={items}
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
    draft: Survey.isDraft(surveyInfo),

    parentCodeDefUuid: NodeDef.getParentCodeDefUuid(nodeDef),
    categoryUuid: category ? Category.getUuid(category) : null,
    categoryLevelIndex: categoryLevelIndex,
    nodeParentCodeUuid: Node.getCategoryItemUuid(nodeParentCode),
    codeUuidsHierarchy
  }
}

export default connect(mapStateToProps)(NodeDefCode)
