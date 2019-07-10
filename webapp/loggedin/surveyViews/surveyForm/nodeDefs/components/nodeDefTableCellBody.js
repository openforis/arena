import './nodeDefTableCellBody.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'
import axios from 'axios'
import Promise from 'bluebird'

import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'
import useI18n from '../../../../../commonComponents/useI18n'

import Survey from '../../../../../../common/survey/survey'
import NodeDef from '../../../../../../common/survey/nodeDef'
import CategoryItem from '../../../../../../common/survey/categoryItem'
import Node from '../../../../../../common/record/node'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './nodeDefErrorBadge'

const getNodeValues = async (surveyInfo, nodeDef, nodes, lang) => {

  const getNodeValue = async node => {
    if (NodeDef.isCode(nodeDef)) {
      const item = await loadCategoryItem(surveyInfo, Node.getCategoryItemUuid(node))
      const label = CategoryItem.getLabel(lang)(item)
      return label || CategoryItem.getCode(item)
    } else if (NodeDef.isFile(nodeDef)) {
      return Node.getFileName(node)
    } else {
      return Node.getValue(node)
    }
  }

  const nodeValues = await Promise.all(
    R.pipe(
      R.reject(n => Node.isPlaceholder(n) || Node.isValueBlank(n)),
      R.map(getNodeValue)
    )(nodes)
  )

  return R.join(', ', nodeValues)
}

const loadCategoryItem = async (surveyInfo, itemUuid) => {
  const config = {
    params: {
      draft: Survey.isDraft(surveyInfo)
    }
  }
  const { data: { item } } = await axios.get(`/api/survey/${Survey.getIdSurveyInfo(surveyInfo)}/categories/items/${itemUuid}`, config)
  return item
}

class NodeDefMultipleTableCell extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showEditDialog: false,
      nodeValues: '',
    }
  }

  async componentDidMount () {
    await this.loadNodeValues()
  }

  async componentDidUpdate (prevProps) {
    const { nodes: prevNodes } = prevProps

    if (!R.equals(prevNodes, this.props.nodes)) {
      await this.loadNodeValues()
    }
  }

  async loadNodeValues () {
    const { surveyInfo, nodeDef, nodes, lang } = this.props
    const nodeValues = await getNodeValues(surveyInfo, nodeDef, nodes, lang)

    this.setState({ nodeValues })
  }

  setShowEditDialog (showEditDialog) {
    this.setState({ showEditDialog })
  }

  render () {
    const { canEditRecord } = this.props
    const { showEditDialog, nodeValues } = this.state

    return showEditDialog
      ? (
        ReactDOM.createPortal(
          <NodeDefMultipleEditDialog
            {...this.props}
            onClose={() => this.setShowEditDialog(false)}
          />,
          document.body
        )
      )
      : (
        <div className="survey-form__node-def-table-cell-body-multiple">
          <span className="values-summary">
            {nodeValues}
          </span>
          <button className="btn-s"
                  onClick={() => this.setShowEditDialog(true)}>
            <span className={`icon icon-12px ${canEditRecord ? 'icon-pencil2' : 'icon-eye'}`}/>
          </button>
        </div>
      )
  }
}

const NodeDefTableCellBody = props => {
  const {
    surveyInfo, nodeDef,
    parentNode, nodes, edit,
  } = props
  const surveyLanguage = Survey.getLanguage(useI18n().lang)(surveyInfo)

  return (
    <NodeDefErrorBadge
      nodeDef={nodeDef}
      parentNode={parentNode}
      nodes={nodes}
      edit={edit}>

      {
        NodeDef.isMultiple(nodeDef) || NodeDef.isCode(nodeDef)
          ? (
            <NodeDefMultipleTableCell
              {...props}
              lang={surveyLanguage}
            />
          )
          : (
            React.createElement(NodeDefUiProps.getNodeDefComponent(nodeDef), { ...props })
          )
      }

    </NodeDefErrorBadge>
  )

}

export default NodeDefTableCellBody