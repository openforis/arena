import '../../nodeDefs.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import axios from 'axios'

import NodeDefCodeDropdown from './nodeDefCodeDropdown'
import NodeDefCodeCheckbox from './nodeDefCodeCheckbox'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Survey from '../../../../../../common/survey/survey'
import Category from '../../../../../../common/survey/category'
import Record from '../../../../../../common/record/record'
import Node from '../../../../../../common/record/node'
import { isRenderDropdown } from '../../../../../../common/survey/nodeDefLayout'

import { getStateSurveyInfo, getSurvey } from '../../../../../survey/surveyState'
import { getRecord } from '../../../record/recordState'
import { getSurveyForm } from '../../../surveyFormState'

class NodeDefCode extends React.Component {

  constructor (props) {
    super(props)

    this.state = { items: [] }
  }

  async componentDidMount () {
    const { edit } = this.props

    if (!edit) {
      await this.loadCategoryItems()
    }
  }

  async componentDidUpdate (prevProps) {
    const { parentCodeDefUuid, parentItemUuid } = this.props

    if (parentCodeDefUuid) {
      //parent item changed, reload items
      if (parentItemUuid !== prevProps.parentItemUuid) {
        await this.loadCategoryItems()
      }
    }
  }

  async loadCategoryItems () {
    const { surveyInfo, categoryUuid, categoryLevelIndex, parentItemUuid, draft } = this.props

    let items = []

    if (categoryUuid && (parentItemUuid || categoryLevelIndex === 0)) {
      const { data } = await axios.get(
        `/api/survey/${surveyInfo.id}/categories/${categoryUuid}/items`,
        { params: { draft, parentUuid: parentItemUuid } }
      )
      items = data.items
    }
    this.setState({ items })
  }

  determineNodeToUpdate () {
    const { nodeDef, nodes, parentNode } = this.props

    const placeholder = R.find(R.propEq('placeholder', true))(nodes)

    return (
      placeholder
        ? placeholder
        : nodes.length === 1 && !NodeDef.isNodeDefMultiple(nodeDef)
        ? nodes[0]
        : Node.newNode(nodeDef.uuid, parentNode.recordUuid, parentNode.uuid)
    )
  }

  getSelectedItems () {
    const { nodes } = this.props
    const { items } = this.state

    const selectedItemUuids = R.pipe(
      R.values,
      R.reject(R.propEq('placeholder', true)),
      R.map(Node.getCategoryItemUuid),
      R.reject(R.isNil),
    )(nodes)

    return R.filter(item => R.includes(item.uuid)(selectedItemUuids))(items)
  }

  handleSelectedItemsChange (newSelectedItems) {
    const { nodeDef, nodes, codeUuidsHierarchy, removeNode, updateNode } = this.props

    const selectedItems = this.getSelectedItems()

    const multiple = NodeDef.isNodeDefMultiple(nodeDef)

    //remove deselected node
    if (multiple) {
      const deselectedItem = R.head(R.difference(selectedItems, newSelectedItems))
      if (deselectedItem) {
        removeNode(nodeDef, R.find(n => Node.getCategoryItemUuid(n) === deselectedItem.uuid)(nodes))
      }
    }

    //handle one selected item change each time
    const newSelectedItem = R.head(R.difference(newSelectedItems, selectedItems))

    const nodeToUpdate = this.determineNodeToUpdate()

    updateNode(nodeDef, nodeToUpdate, {
      itemUuid: newSelectedItem ? newSelectedItem.uuid : null,
      h: codeUuidsHierarchy
    })
  }

  render () {
    const { nodeDef } = this.props
    const { items } = this.state

    const selectedItems = this.getSelectedItems()

    return (
      isRenderDropdown(nodeDef)
        ? <NodeDefCodeDropdown {...this.props}
                               items={items}
                               selectedItems={selectedItems}
                               onSelectedItemsChange={this.handleSelectedItemsChange.bind(this)}/>
        : <NodeDefCodeCheckbox {...this.props}
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
  const { nodeDef, parentNode } = props

  const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)

  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const category = Survey.getCategoryByUuid(NodeDef.getNodeDefCategoryUuid(nodeDef))(survey)

  return {
    surveyInfo,
    draft: Survey.isDraft(surveyInfo),
    language: Survey.getDefaultLanguage(surveyInfo),

    parentCodeDefUuid: NodeDef.getNodeDefParentCodeDefUuid(nodeDef),
    categoryUuid: category ? Category.getUuid(category) : null,
    categoryLevelIndex: categoryLevelIndex,
    parentItemUuid: Node.getCategoryItemUuid(parentCodeAttribute),
    codeUuidsHierarchy: Record.getCodeUuidsHierarchy(survey, parentNode, nodeDef)(record),
  }
}

export default connect(mapStateToProps)(NodeDefCode)
