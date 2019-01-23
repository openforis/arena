import React from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'
import axios from 'axios'
import Promise from 'bluebird'

import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import Category from '../../../../../common/survey/category'
import Node from '../../../../../common/record/node'

import { getNodeDefComponent } from '../nodeDefSystemProps'

const getNodeValues = async (surveyInfo, nodes) => {
  const nodeValues = R.pipe(
    R.reject(R.propEq('placeholder', true)),
    R.map(Node.getNodeValue),
  )(nodes)

  const stringNodeValues = await Promise.all(
    nodeValues.map(
      async nodeValue =>
        nodeValue.fileName ? nodeValue.fileName
          : nodeValue.itemUuid ? await loadCategoryItemLabel(surveyInfo, nodeValue.itemUuid)
          : nodeValue
    )
  )

  return R.join(', ', stringNodeValues)
}

const loadCategoryItemLabel = async (surveyInfo, itemUuid) => {
  const {data} = await axios.get(`/api/survey/${surveyInfo.id}/categories/items/${itemUuid}`)
  return Category.getItemLabel(Survey.getDefaultLanguage(surveyInfo))(data.item)
}

class NodeDefMultipleTableBody extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      editDialogOpen: false,
      nodeValues: '',
    }
  }

  async componentDidMount () {
    await this.loadNodeValues()
  }

  async componentDidUpdate (prevProps) {
    const {nodes: prevNodes} = prevProps

    if (!R.equals(prevNodes, this.props.nodes)) {
      await this.loadNodeValues()
    }
  }

  async loadNodeValues () {
    this.setState({
      nodeValues: await getNodeValues(this.props.surveyInfo, this.props.nodes)
    })
  }

  toggleEditDialogOpen (open) {
    this.setState({editDialogOpen: open})
  }

  render () {
    return this.state.editDialogOpen
      ? (
        ReactDOM.createPortal(
          <NodeDefMultipleEditDialog {...this.props}
                                     onClose={() => this.toggleEditDialogOpen(false)}/>,
          document.body
        )
      )
      : (
        <div className="node-def__text-multiple-table-cell">
          <span className="values-summary">{this.state.nodeValues}</span>
          <button className="btn-s btn-of-light-xs"
                  onClick={() => this.toggleEditDialogOpen(true)}>
            {
              this.props.canEditRecord
                ? <span className="icon icon-pencil2 icon-12px" />
                : <span className="icon icon-eye icon-12px"/>
            }
          </button>
        </div>
      )
  }
}

const NodeDefTableBody = props => {
  const {nodeDef} = props

  return (
    NodeDef.isNodeDefMultiple(nodeDef) || NodeDef.isNodeDefCode(nodeDef)
      ? <NodeDefMultipleTableBody {...props}/>
      : React.createElement(getNodeDefComponent(nodeDef), {...props})
  )
}

export default NodeDefTableBody