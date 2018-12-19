import './nodeDefSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Dropdown from '../../../../commonComponents/form/dropdown'
import VariablesSelector from './variablesSelector'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import * as SurveyState from '../../../../survey/surveyState'
import { nbsp } from '../../../../../common/stringUtils'

const TableSelector = ({hierarchy, nodeDefUuid, lang, onChange}) => {
  const entities = []
  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getNodeDefLabel(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: R.range(0, depth).map(i => nbsp + nbsp + nbsp + nbsp + nbsp).join('') + label
    })
  }
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return (
    <div className="form-item">
      <div>Entity</div>
      <Dropdown items={entities} selection={entities.find(R.propEq('key', nodeDefUuid))}
                autocompleteDialogClassName="entity-selector__autocomplete-dialog"
                onChange={item => onChange(R.prop('key', item))}/>
    </div>
  )
}

class NodeDefSelector extends React.Component {
  constructor () {
    super()
    this.state = {nodeDefUuid: null}
  }

  render () {
    const {hierarchy, lang} = this.props
    const {nodeDefUuid} = this.state

    return (
      <div className="node-def-selector">

        <TableSelector hierarchy={hierarchy} nodeDefUuid={nodeDefUuid}
                       lang={lang} onChange={nodeDefUuid => this.setState({nodeDefUuid})}/>

        <VariablesSelector nodeDefUuid={nodeDefUuid} lang={lang}/>

        <button className="btn btn-of-light btn-sync">
          Sync
          <span className="icon icon-loop icon-16px icon-right"/>
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
  mapStateToProps
)(NodeDefSelector)


