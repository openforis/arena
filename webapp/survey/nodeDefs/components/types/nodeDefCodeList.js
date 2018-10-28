import '../node-def.scss'

import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import InputChips from '../../../../commonComponents/form/inputChips'
import NodeDefFormItem from './nodeDefFormItem'

import {
  isRenderDropdown, nodeDefRenderType
} from '../../../../../common/survey/nodeDefLayout'
import {
  isNodeDefMultiple,
  getNodeDefCodeListUUID,
  getNodeDefParentCodeUUID
} from '../../../../../common/survey/nodeDef'
import { getCodeListItemCode, getCodeListItemLabel } from '../../../../../common/survey/codeList'
import {
  getSurveyDefaultLanguage,
  getSurveyCodeListByUUID,
  getNodeDefCodeListLevelIndex
} from '../../../../../common/survey/survey'
import { getNodeCodeAncestorValues } from '../../../../../common/record/record'
import { getNodeValue, newNode } from '../../../../../common/record/node'

import { toQueryString } from '../../../../../server/serverUtils/request'
import Dropdown from '../../../../commonComponents/form/dropdown'

const CodeListDropdown = props => {
  const {survey, edit, nodeDef, nodes, items = []} = props

  const disabled = R.isEmpty(items)

  const language = getSurveyDefaultLanguage(survey)

  const selectedCodes = R.pipe(
    R.values,
    R.reject(node => node.placeholder),
    R.map(n => getNodeValue(n).code),
  )(nodes)

  const selectedItems = R.filter(item => R.contains(getCodeListItemCode(item))(selectedCodes))(items)

  const handleSelectedItemsChange = (newSelectedItems) => {
    const {nodeDef, nodes, parentNode, removeNode, updateNode} = props

    const newSelectedCodes = newSelectedItems.map(item => getCodeListItemCode(item))

    if (isNodeDefMultiple(nodeDef)) {
      //remove deselected node
      const removedNode = R.find(n => !R.contains(getNodeValue(n).code, newSelectedCodes))(nodes)
      if (removedNode && removedNode.id) {
        removeNode(nodeDef, removedNode)
      }
    }
    //add new node or update existing one
    const newSelectedCode = R.pipe(
      R.find(code => !R.contains(code, selectedCodes)),
      R.defaultTo(null),
    )(newSelectedCodes)

    const placeholder = R.find(R.propEq('placeholder', true))(nodes)
    const nodeToUpdate = placeholder
      ? placeholder
      : nodes.length === 1 && !isNodeDefMultiple(nodeDef)
        ? nodes[0]
        : newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
    updateNode(nodeDef, nodeToUpdate, {code: newSelectedCode})
  }

  return isNodeDefMultiple(nodeDef)
    ? <InputChips readOnly={edit}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={getCodeListItemLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => handleSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={edit}
                items={items}
                disabled={disabled}
                itemKeyProp="uuid"
                itemLabelFunction={getCodeListItemLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => handleSelectedItemsChange(item ? [item] : [])}/>
}

const Checkbox = props => {
  const {survey, edit, item, nodeDef, parentNode, nodes, updateNode, removeNode} = props

  const language = getSurveyDefaultLanguage(survey)
  const itemCode = getCodeListItemCode(item)
  const matchingNode = R.find(node => getNodeValue(node).code === itemCode)(nodes)
  const selected = !R.isNil(matchingNode)

  return (
    <button
      className={`btn btn-of-light ${selected ? 'active' : ''}`}
      style={{
        pointerEvents: 'all',
      }}
      aria-disabled={edit}
      onClick={() => {
        if (selected) {
          removeNode(nodeDef, matchingNode)
        } else {
          const nodeToUpdate =
            (isNodeDefMultiple(nodeDef) || R.isEmpty(nodes))
              ? newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
              : nodes[0]
          updateNode(nodeDef, nodeToUpdate, {code: itemCode})
        }
      }}>
      {getCodeListItemLabel(language)(item)}
    </button>
  )
}

const CodeListCheckbox = props => {
  const {items = []} = props

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      items.map(item =>
        <Checkbox {...props}
                  disabled={disabled}
                  key={item.uuid}
                  item={item}/>
      )
    }
  </div>
}

const CodeListRenderer = props =>
  isRenderDropdown(props.nodeDef)
    ? <CodeListDropdown {...props}/>
    : <CodeListCheckbox {...props}/>

class NodeDefCodeList extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      items: [],
    }
  }

  async componentDidMount () {
    const {edit} = this.props

    if (!edit) {
      await this.loadCodeListItems()
    }
  }

  async componentDidUpdate (prevProps) {
    const {survey, nodeDef, record, parentNode} = this.props

    if (getNodeDefParentCodeUUID(nodeDef)) {
      const {record: prevRecord, parentNode: prevParentNode} = prevProps

      const ancestorCodes = getNodeCodeAncestorValues(survey, parentNode, nodeDef)(record)
      const prevAncestorCodes = getNodeCodeAncestorValues(survey, prevParentNode, nodeDef)(prevRecord)

      if (!R.equals(ancestorCodes, prevAncestorCodes)) {
        await this.loadCodeListItems()
      }
    }
  }

  async loadCodeListItems () {
    const {survey, record, parentNode, nodeDef} = this.props

    const levelIndex = getNodeDefCodeListLevelIndex(nodeDef)(survey)
    const ancestorCodes = getNodeCodeAncestorValues(survey, parentNode, nodeDef)(record)

    if (ancestorCodes.length === levelIndex) {
      const codeList = getSurveyCodeListByUUID(getNodeDefCodeListUUID(nodeDef))(survey)

      const queryParams = {
        draft: false,
        ancestorCodes,
      }
      const {data} = await axios.get(`/api/survey/${survey.id}/codeLists/${codeList.id}/candidateItems?${toQueryString(queryParams)}`)
      const items = data.items

      this.setState({
        items
      })
    } else {
      this.setState({
        items: []
      })
    }
  }

  render () {
    const {edit, label, renderType} = this.props
    const {items} = this.state

    // table header
    if (renderType === nodeDefRenderType.tableHeader) {
      return <label className="node-def__table-header">
        {label}
      </label>
    }

    // EDIT MODE
    if (edit)
      return <NodeDefFormItem {...this.props}>
        <CodeListDropdown {...this.props} />
      </NodeDefFormItem>

    // ENTRY MODE
    if (renderType === nodeDefRenderType.tableBody) {
      return <CodeListRenderer {...this.props}
                               items={items}/>
    } else {
      return (
        <NodeDefFormItem {...this.props}>
          <CodeListRenderer {...this.props}
                            items={items}/>
        </NodeDefFormItem>
      )
    }
  }
}

export default NodeDefCodeList