import './surveyHierarchy.scss'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'

import * as SurveyState from '../../../survey/surveyState'
import * as NodeDefUiProps from '../../surveyForm/nodeDefs/nodeDefSystemProps'

import * as Tree from './surveyHierarchyTree'

class Variables extends React.Component {
  render () {
    const {
      childDefs, lang,
      // filterTypes,
    } = this.props

    // const filtered = nodeDef => NodeDef.isNodeDefAttribute(nodeDef) &&
    //   (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

    // console.log(childDefs) // DEBUG
    return childDefs && (
      childDefs.map(
        childDef => {
          const childDefUuid = NodeDef.getUuid(childDef)

          return <button key={childDefUuid}>
            {NodeDef.getNodeDefLabel(childDef, lang)}
            {NodeDefUiProps.getNodeDefIconByType(NodeDef.getType(childDef))}
          </button>
        }
      )
    )
  }
}

Variables.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

const mapStateToProps_ = (state, props) => {
  const { nodeDefUuid } = props
  const survey = SurveyState.getSurvey(state)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const childDefs = nodeDefUuid
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  return {
    nodeDefParent,
    childDefs,
  }
}
const VariablesConnect = connect(mapStateToProps_)(Variables)

class SurveyHierarchy extends React.Component {

  constructor (props) {
    super(props)

    this.state = { nodeDefUuid: null }
    this.treeEl = React.createRef()
  }

  componentDidMount () {
    if (this.props.ready)
      this.initTree()
  }

  componentDidUpdate (prevProps) {
    const { ready } = this.props
    const { ready: readyPrev } = prevProps

    if (ready && !readyPrev) {
      this.initTree()
    }
  }

  initTree () {
    const { treeData, lang } = this.props
    const treeElement = this.treeEl.current
    const onEntityClick = (nodeDefUuid) => this.setState({ nodeDefUuid })

    Tree.init(treeElement, treeData, lang, onEntityClick)
  }

  render () {
    const { lang } = this.props
    const { nodeDefUuid } = this.state

    return (
      <div className="survey-hierarchy">

        <div className="survey-hierarchy__tree" ref={this.treeEl}/>

        <div className="survey-hierarchy__attributes">
          <VariablesConnect nodeDefUuid={nodeDefUuid} lang={lang}/>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const ready = SurveyState.surveyDefsFetched(state)
  const treeData = Survey.getHierarchy()(survey).root
  const lang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return {
    treeData,
    lang,
    ready,
  }
}

export default connect(mapStateToProps)(SurveyHierarchy)