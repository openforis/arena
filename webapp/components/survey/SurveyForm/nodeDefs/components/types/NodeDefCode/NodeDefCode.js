import './NodeDefCode.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Surveys } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { useItems } from './store'
import NodeDefCodeCheckbox from './NodeDefCodeCheckbox'
import NodeDefCodeDropdown from './NodeDefCodeDropdown'
import { useRecordCodeAttributesUuidsHierarchy } from '@webapp/store/ui/record/hooks'

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

  const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
  const itemsCount = Category.getItemsCount(category)
  const autocomplete = itemsCount > Category.maxCategoryItemsInIndex

  const codeAttributesUuidsHierarchy = useRecordCodeAttributesUuidsHierarchy({ nodeDef, parentNode })
  const enumerator = Surveys.isNodeDefEnumerator({ survey, nodeDef })
  const readOnly = readOnlyProp || enumerator
  const singleNode = NodeDef.isSingle(nodeDef) || entryDataQuery

  const items = useItems({ nodeDef, parentNode, draft, edit, entryDataQuery })
  const [selectedItems, setSelectedItems] = useState([])

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

  const onItemAdd = (item) => {
    const existingNode = singleNode ? nodes[0] : null
    const node = existingNode ?? Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)

    const value = Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item) })
    const meta = { [Node.metaKeys.hierarchyCode]: codeAttributesUuidsHierarchy }
    const refData = { [NodeRefData.keys.categoryItem]: item }

    updateNode(nodeDef, node, value, null, meta, refData)
  }

  const onItemRemove = (item) => {
    if (singleNode) {
      updateNode(nodeDef, nodes[0], {}, null, {}, {})
    } else {
      const nodeToRemove = nodes.find((node) => Node.getCategoryItemUuid(node) === CategoryItem.getUuid(item))
      removeNode(nodeDef, nodeToRemove)
    }
  }

  const itemLabelFunction = useCallback(
    (item) =>
      NodeDefLayout.isCodeShown(surveyCycleKey)(nodeDef)
        ? CategoryItem.getLabelWithCode(lang)(item)
        : CategoryItem.getLabel(lang)(item),
    [lang, nodeDef, surveyCycleKey]
  )

  return NodeDefLayout.isRenderDropdown(surveyCycleKey)(nodeDef) || entryDataQuery || autocomplete ? (
    <NodeDefCodeDropdown
      canEditRecord={canEditRecord}
      edit={edit}
      entryDataQuery={entryDataQuery}
      itemLabelFunction={itemLabelFunction}
      items={items}
      autocomplete={autocomplete}
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
