import '../node-def.scss'

import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import InputChips from '../../../../commonComponents/form/inputChips'
import NodeDefFormItem from './nodeDefFormItem'

import {
  isRenderDropdown
} from '../../../../../common/survey/nodeDefLayout'
import { getCodeListUUID, isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { getCodeListItemCode, getCodeListItemLabel } from '../../../../../common/survey/codeList'
import { getSurveyDefaultLanguage, getSurveyCodeListByUUID } from '../../../../../common/survey/survey'
import { getNodeValue, newNode } from '../../../../../common/record/node'

import { toQueryString } from '../../../../../server/serverUtils/request'

const CodeListDropdown = props => {
  const {edit, items} = props

  const handleSelectedItemsChange = (selectedItems) => {
    const {nodeDef, nodes, parentNode, removeNode, updateNode} = props

    const selectedCodes = selectedItems.map(item => item.key)
    const removedNode = R.find(n => !R.contains(getNodeValue(n).code, selectedCodes))(nodes)

    if (removedNode && removedNode.id) {
      removeNode(nodeDef, removedNode)
    } else {
      const oldCodes = R.pipe(
        R.values,
        R.reject(node => node.placeholder),
        R.map(n => getNodeValue(n).code),
      )(nodes)
      const newCodeItem = R.find(item => !R.contains(item.key, oldCodes))(selectedItems)
      updateNode(nodeDef, newNode(nodeDef.id, parentNode.recordId, parentNode.uuid), {code: newCodeItem.key})
    }
  }

  return <InputChips readOnly={edit}
                     items={items}
                     onChange={selectedItems => handleSelectedItemsChange(selectedItems)}/>
}

const Checkbox = props => {
  const {edit, item, nodeDef, parentNode, nodes, updateNode, removeNode} = props

  const matchingNode = R.find(node => getNodeValue(node).code === item.key)(nodes)
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
          updateNode(nodeDef, nodeToUpdate, {code: item.key})
        }
      }}>
      {item.value}
    </button>
  )
}

const CodeListCheckbox = props => {
  const {items} = props
  return <div className="node-def__code-checkbox-wrapper">
    {
      items.map(item =>
        <Checkbox {...props}
                  key={item.key}
                  item={item}/>
      )
    }
  </div>
}

class NodeDefCodeList extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      items: [],
    }
  }

  async componentDidMount () {
    const {edit, survey} = this.props

    if (!edit) {
      const codeListItems = await this.loadCodeListItems()

      const language = getSurveyDefaultLanguage(survey)

      const items = codeListItems.map(item => ({
        key: getCodeListItemCode(item),
        value: `${getCodeListItemCode(item)} - ${getCodeListItemLabel(language)(item)}`
      }))

      this.setState({
        items
      })
    }
  }

  async loadCodeListItems () {
    const {survey, nodeDef} = this.props

    const codeList = getSurveyCodeListByUUID(getCodeListUUID(nodeDef))(survey)

    const parentId = null //TODO determine parent code list item id (if parent code is specified)

    const queryParams = {
      draft: false,
      parentId,
    }
    const {data} = await axios.get(`/api/survey/${survey.id}/codeLists/${codeList.id}/items?${toQueryString(queryParams)}`)
    const {items} = data
    return items
  }

  render () {
    const {nodeDef} = this.props
    const {items} = this.state

    return (
      <NodeDefFormItem {...this.props}>
        {isRenderDropdown(nodeDef)
          ? <CodeListDropdown {...this.props}
                              items={items}/>
          : <CodeListCheckbox {...this.props}
                              items={items}/>
        }
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCodeList