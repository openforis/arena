import './nodeDefSelector.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Dropdown from '../../../../commonComponents/form/dropdown'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import * as SurveyState from '../../../../survey/surveyState'

const EntitySelector = ({hierarchy, lang}) => {
  const entities = []
  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getNodeDefLabel(lang)(nodeDef)
    entities.push({
      key: NodeDef.getNodeDefName(nodeDef),
      value: R.range(0, depth).map(i => '\xA0\xA0\xA0\xA0\xA0').join('') + label
    })
  }
  Survey.traverseHierarchyItem(hierarchy.root, traverse)

  return (
    <Dropdown items={entities} autocompleteDialogClassName="entity-selector__autocomplete-dialog"/>
  )
}

const NodeDefSelector = (props) => {
  const {hierarchy, lang} = props

  return (
    <div className="node-def-selector">

      <EntitySelector hierarchy={hierarchy} lang={lang}/>

    </div>
  )
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


