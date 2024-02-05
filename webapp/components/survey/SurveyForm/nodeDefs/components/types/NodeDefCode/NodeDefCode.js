import './NodeDefCode.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Surveys } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
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
    canEditRecord,
    edit,
    entryDataQuery,
    nodeDef,
    nodes,
    parentNode,
    readOnly: readOnlyProp,
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

  const items = useItems({ nodeDef, parentNode, draft, edit, entryDataQuery })
  const [selectedItems, setSelectedItems] = useState([])

  // On items or nodes change, update selectedItems
  useEffect(() => {
    if (!edit) {
      const selectedItemsUpdate = nodes.map(NodeRefData.getCategoryItem)
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

  return NodeDefLayout.isRenderDropdown(surveyCycleKey)(nodeDef) || entryDataQuery ? (
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

NodeDefCode.defaultProps = {
  canEditRecord: false,
  edit: false,
  entryDataQuery: false,
  nodes: [],
  parentNode: null,
  readOnly: false,
}

export default NodeDefCode
