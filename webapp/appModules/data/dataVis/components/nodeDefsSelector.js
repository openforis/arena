import './nodeDefsSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import * as SurveyState from '../../../../survey/surveyState'

import VariablesSelector from './VariablesSelector'

import { initDataTable } from '../actions'

class NodeDefsSelector extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuid: null,
      nodeDefVariableUuids: [],
    }
  }

  render () {
    const {
      hierarchy, lang,
      initDataTable,
    } = this.props
    const { nodeDefUuid, nodeDefVariableUuids } = this.state

    return (
      <div className="node-defs-selector">

        <VariablesSelector hierarchy={hierarchy}
                           lang={lang}
                           canSelectVariables={true}
                           onVariablesChange={nodeDefVariableUuids => this.setState({ nodeDefVariableUuids })}
                           onTableChange={nodeDefUuid => this.setState({ nodeDefUuid })}/>

        <button className="btn btn-of-light btn-sync"
                onClick={() => initDataTable(nodeDefUuid, nodeDefVariableUuids)}
                aria-disabled={R.isEmpty(nodeDefVariableUuids)}>
          Sync
          <span className="icon icon-loop icon-16px icon-right" />
          {/*<span className="icon icon-spinner10 icon-20px icon-right"/>*/}
        </button>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  return {
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    hierarchy: Survey.getHierarchy()(survey),
  }
}

export default connect(
  mapStateToProps,
  { initDataTable }
)(NodeDefsSelector)


