import '../../nodeDefs.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import axios from 'axios'

import NodeDefCodeListDropdown from './nodeDefCodeListDropdown'
import NodeDefCodeListCheckbox from './nodeDefCodeListCheckbox'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Survey from '../../../../../../common/survey/survey'
import Record from '../../../../../../common/record/record'
import Node from '../../../../../../common/record/node'
import { isRenderDropdown } from '../../../../../../common/survey/nodeDefLayout'

import { toQueryString } from '../../../../../../server/serverUtils/request'
import { getStateSurveyInfo, getSurvey } from '../../../../../survey/surveyState'
import { getRecord } from '../../../record/recordState'
import { getSurveyForm } from '../../../surveyFormState'

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
    const {parentCodeDefUUID, parentItemUUID} = this.props

    if (parentCodeDefUUID) {
      //parent item changed, reload items
      if (parentItemUUID !== prevProps.parentItemUUID) {
        await this.loadCodeListItems()
      }
    }
  }

  async loadCodeListItems () {
    const {surveyInfo, codeListId, codeListLevelIndex, parentItemUUID} = this.props

    if (codeListId && (parentItemUUID || codeListLevelIndex === 0)) {
      const params = {draft: false, parentUuid: parentItemUUID}
      const {data} = await axios.get(`/api/survey/${surveyInfo.id}/codeLists/${codeListId}/items?${toQueryString(params)}`)

      this.setState({items: data.items})
    } else {
      this.setState({items: []})
    }
  }

  determineNodeToUpdate () {
    const {nodeDef, nodes, parentNode} = this.props

    const placeholder = R.find(R.propEq('placeholder', true))(nodes)

    return (
      placeholder
        ? placeholder
        : nodes.length === 1 && !NodeDef.isNodeDefMultiple(nodeDef)
        ? nodes[0]
        : Node.newNode(nodeDef.uuid, parentNode.recordId, parentNode.uuid)
    )
  }

  getSelectedItems () {
    const {nodes} = this.props
    const {items} = this.state

    const selectedItemUUIDs = R.pipe(
      R.values,
      R.reject(R.propEq('placeholder', true)),
      R.map(Node.getNodeItemUuid),
      R.reject(R.isNil),
    )(nodes)

    return R.filter(item => R.includes(item.uuid)(selectedItemUUIDs))(items)
  }

  handleSelectedItemsChange (newSelectedItems) {
    const {nodeDef, nodes, codeUUIDsHierarchy, removeNode, updateNode} = this.props

    const selectedItems = this.getSelectedItems()

    const multiple = NodeDef.isNodeDefMultiple(nodeDef)

    //remove deselected node
    if (multiple) {
      const deselectedItem = R.head(R.difference(selectedItems, newSelectedItems))
      if (deselectedItem) {
        removeNode(nodeDef, R.find(n => Node.getNodeItemUuid(n) === deselectedItem.uuid)(nodes))
      }
    }

    //handle one selected item change each time
    const newSelectedItem = R.head(R.difference(newSelectedItems, selectedItems))

    const nodeToUpdate = this.determineNodeToUpdate()

    updateNode(nodeDef, nodeToUpdate, {itemUuid: newSelectedItem ? newSelectedItem.uuid : null, h: codeUUIDsHierarchy})
  }

  render () {
    const {edit, nodeDef} = this.props
    const {items} = this.state

    const selectedItems = this.getSelectedItems()

    return edit
      ? (
        // EDIT MODE
        <NodeDefCodeListDropdown {...this.props} />
      )
      : (
        // ENTRY MODE
        isRenderDropdown(nodeDef)
          ? <NodeDefCodeListDropdown {...this.props}
                                     items={items}
                                     selectedItems={selectedItems}
                                     onSelectedItemsChange={this.handleSelectedItemsChange.bind(this)}/>
          : <NodeDefCodeListCheckbox {...this.props}
                                     items={items}
                                     selectedItems={selectedItems}
                                     onSelectedItemsChange={this.handleSelectedItemsChange.bind(this)}/>
      )
  }
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const surveyInfo = getStateSurveyInfo(state)

  const record = getRecord(surveyForm)
  const {nodeDef, parentNode} = props

  const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const parentItemUUID = Node.getNodeItemUuid(parentCodeAttribute)

  const codeListLevelIndex = Survey.getNodeDefCodeListLevelIndex(nodeDef)(survey)
  const codeList = Survey.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey)

  const codeUUIDsHierarchy = Record.getCodeUUIDsHierarchy(survey, parentNode, nodeDef)(record)

  return {
    surveyInfo: surveyInfo,
    language: Survey.getDefaultLanguage(surveyInfo),
    parentCodeDefUUID: NodeDef.getNodeDefParentCodeUUID(nodeDef),
    codeListId: codeList ? codeList.id : null,
    codeListLevelIndex,
    parentItemUUID,
    codeUUIDsHierarchy,
  }
}

export default connect(mapStateToProps)(NodeDefCodeList)
