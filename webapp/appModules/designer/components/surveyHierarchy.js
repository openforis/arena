import './surveyHierarchy.scss'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'
// import NodeDef from '../../../../common/survey/nodeDef'

import * as SurveyState from '../../../survey/surveyState'
// import * as NodeDefUiProps from '../../surveyForm/nodeDefs/nodeDefSystemProps'

import * as Tree from './surveyHierarchyTree'

import TableSelector from '../../data/dataVis/components/tableSelector'

class SurveyHierarchy extends React.Component {

  constructor (props) {
    super(props)

    this.state = { selectedNodeDefUuid: null }
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
    const { hierarchy, lang } = this.props
    const treeElement = this.treeEl.current
    const onEntityClick = (selectedNodeDefUuid) => this.setState({ selectedNodeDefUuid })

    Tree.init(treeElement, hierarchy.root, lang, onEntityClick)
  }

  render () {
    const { lang, hierarchy } = this.props
    const { selectedNodeDefUuid } = this.state

    return (
      <div className="survey-hierarchy">

        <div className="survey-hierarchy__tree" ref={this.treeEl}/>

        <div className="survey-hierarchy__attributes">
          <TableSelector hierarchy={hierarchy}
                         lang={lang}
                         showAncestors={false}
                         canSelectVariables={false}
                         selectedTableUuid={selectedNodeDefUuid}/>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const ready = SurveyState.surveyDefsFetched(state)
  const hierarchy = Survey.getHierarchy()(survey)
  const lang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return {
    hierarchy,
    lang,
    ready,
  }
}

export default connect(mapStateToProps)(SurveyHierarchy)