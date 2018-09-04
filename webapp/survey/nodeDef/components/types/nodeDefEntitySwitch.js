import '../react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import NodeDefEntityTable from './nodeDefEntityTable'
import NodeDefEntityForm from './nodeDefEntityForm'

import { getNodeDefChildren } from '../../../../../common/survey/survey'
import {
  nodeDefLayoutProps,
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { fetchNodeDefChildren, putNodeDefProp, } from '../../actions'

class NodeDefEntitySwitch extends React.Component {

  componentDidMount () {
    const {nodeDef} = this.props

    if (nodeDef.id)
      this.fetchChildren()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDef} = this.props
    const {id: nodeDefId} = nodeDef
    const prevNodeDefId = R.path(['nodeDef', 'id'], prevProps)

    if (nodeDefId && nodeDefId !== prevNodeDefId)
      this.fetchChildren()
  }

  fetchChildren () {
    const {nodeDef, fetchNodeDefChildren, draft, edit} = this.props
    fetchNodeDefChildren(nodeDef.id, draft, edit)
  }

  render () {
    const {nodeDef} = this.props

    if (isRenderForm(nodeDef))
      return <NodeDefEntityForm {...this.props} />
    else if (isRenderTable(nodeDef))
      return <NodeDefEntityTable {...this.props} />

    return null
  }
}

NodeDefEntitySwitch.defaultProps = {
  entityDef: {},
  draft: false,
  edit: false,
}

const mapStateToProps = (state, props) => ({
  childDefs: getNodeDefChildren(props.nodeDef)(props.survey),
})

export default connect(
  mapStateToProps,
  {putNodeDefProp, fetchNodeDefChildren}
)(NodeDefEntitySwitch)