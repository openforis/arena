import './nodeDefCode.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import axios from 'axios'

import NodeDefCodeDropdown from './nodeDefCodeDropdown'
import NodeDefCodeCheckbox from './nodeDefCodeCheckbox'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Survey from '../../../../../../../common/survey/survey'
import Category from '../../../../../../../common/survey/category'
import CategoryItem from '../../../../../../../common/survey/categoryItem'
import Record from '../../../../../../../common/record/record'
import Node from '../../../../../../../common/record/node'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'

import * as AppState from '../../../../../../app/appState'
import * as SurveyState from '../../../../../../survey/surveyState'
import * as RecordState from '../../../../record/recordState'

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
    const { parentItemUuid: prevParentItemUuid } = prevProps

    if (parentCodeDefUuid && parentItemUuid !== prevParentItemUuid) {
      await this.loadCategoryItems()
    }
  }

  async loadCategoryItems () {
    const { surveyId, categoryUuid, categoryLevelIndex, parentItemUuid, draft } = this.props

    let items = []

    if (categoryUuid && (parentItemUuid || categoryLevelIndex === 0)) {
      const { data } = await axios.get(
        `/api/survey/${surveyId}/categories/${categoryUuid}/items`,
        { params: { draft, parentUuid: parentItemUuid } }
      )
      items = data.items
    }
    this.setState({ items })
  }

  determineNodeToUpdate () {
    const { nodeDef, nodes, parentNode } = this.props

    const placeholder = R.find(Node.isPlaceholder)(nodes)

    return (
      placeholder
        ? placeholder
        : NodeDef.isSingle(nodeDef) && nodes.length === 1
        ? nodes[0]
        : Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
    )
  }

  getSelectedItems () {
    const { nodes } = this.props
    const { items } = this.state

    const selectedItemUuids = R.pipe(
      R.values,
      R.reject(Node.isPlaceholder),
      R.map(Node.getCategoryItemUuid),
      R.reject(R.isNil),
    )(nodes)

    return R.filter(item => R.includes(CategoryItem.getUuid(item))(selectedItemUuids))(items)
  }

  handleSelectedItemsChange (newSelectedItems) {
    const { nodeDef, nodes, codeUuidsHierarchy, removeNode, updateNode } = this.props

    const selectedItems = this.getSelectedItems()

    // handle one selected item change each time

    // if multiple, remove deselected node
    if (NodeDef.isMultiple(nodeDef)) {
      const deselectedItem = R.head(R.difference(selectedItems, newSelectedItems))
      if (deselectedItem) {
        const nodeToRemove = R.find(n => Node.getCategoryItemUuid(n) === CategoryItem.getUuid(deselectedItem), nodes)
        removeNode(nodeDef, nodeToRemove)
      }
    }

    const newSelectedItem = R.head(R.difference(newSelectedItems, selectedItems))

    // single attribute => always update value
    // multiple attribute => insert new node only if there is a new selected item
    if (newSelectedItem || NodeDef.isSingle(nodeDef)) {
      const nodeToUpdate = this.determineNodeToUpdate()
      const value = newSelectedItem
        ? {
          [Node.valuePropKeys.itemUuid]: CategoryItem.getUuid(newSelectedItem),
        }
        : null
      const meta = {
        [Node.metaKeys.hierarchyCode]: codeUuidsHierarchy
      }
      updateNode(nodeDef, nodeToUpdate, value, null, meta)
    }
  }

  render () {
    const { nodeDef } = this.props
    const { items } = this.state

    const selectedItems = this.getSelectedItems()

    return (
      NodeDefLayout.isRenderDropdown(nodeDef)
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
  const language = AppState.getLang(state)

  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  const record = RecordState.getRecord(state)
  const { nodeDef, parentNode } = props

  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

  const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)

  const codeUuidsHierarchy = parentCodeAttribute
    ? R.append(Node.getUuid(parentCodeAttribute), Node.getHierarchyCode(parentCodeAttribute))
    : []

  return {
    language,

    surveyId: Survey.getId(survey),
    draft: Survey.isDraft(surveyInfo),

    parentCodeDefUuid: NodeDef.getParentCodeDefUuid(nodeDef),
    categoryUuid: category ? Category.getUuid(category) : null,
    categoryLevelIndex: categoryLevelIndex,
    parentItemUuid: Node.getCategoryItemUuid(parentCodeAttribute),
    codeUuidsHierarchy
  }
}

export default connect(mapStateToProps)(NodeDefCode)
