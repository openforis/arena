import '../node-def.scss'

import React from 'react'
import axios from 'axios'
import * as R from 'ramda'

import NodeDefFormItem from './nodeDefFormItem'

import CodeListDropdown from './codeList/codeListDropdown'
import CodeListCheckbox from './codeList/codeListCheckbox'

import {
  isRenderDropdown, nodeDefRenderType
} from '../../../../../common/survey/nodeDefLayout'
import {
  getNodeDefCodeListUUID,
  getNodeDefParentCodeUUID
} from '../../../../../common/survey/nodeDef'
import {
  getCodeListByUUID,
  getNodeDefCodeListLevelIndex,
  getSurveyId,
} from '../../../../../common/survey/survey'
import { getNodeCodeAncestorValues } from '../../../../../common/record/record'

import {toQueryString} from '../../../../../server/serverUtils/request'

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

      //ancestor codes changed, reload items
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
      const codeList = getCodeListByUUID(getNodeDefCodeListUUID(nodeDef))(survey)

      const params = {
        draft: false,
        ancestorCodes,
      }
      const {data} = await axios.get(`/api/survey/${getSurveyId(survey)}/codeLists/${codeList.id}/candidateItems?${toQueryString(params)}`)

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