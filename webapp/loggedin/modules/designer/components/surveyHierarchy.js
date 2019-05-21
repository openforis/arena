import './surveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../common/survey/survey'

import * as SurveyState from '../../../../survey/surveyState'

import Tree from './surveyHierarchyTree'
import NodeDefsSelectorView from '../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'

const SurveyHierarchy = props => {

  const { hierarchy, ready } = props

  const [ selectedNodeDefUuid, setSelectedNodeDefUuid ] = useState(null)
  const [ tree, setTree ] = useState(null)
  const treeRef = useRef(null)

  useEffect(() => {
    const { lang } = props
    const treeElement = treeRef.current

    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
  }, [ready])

  return (
    <div className="survey-hierarchy">

      <div className="survey-hierarchy__tree" ref={treeRef}/>

      <div className="survey-hierarchy__attributes">
        <NodeDefsSelectorView
          hierarchy={hierarchy}
          nodeDefUuidEntity={selectedNodeDefUuid}
          onChangeEntity={
            nodeDefUuidEntity => tree.expandToNode(nodeDefUuidEntity)
          }
          canSelectAttributes={false}
          showAncestors={false}
        />

      </div>

    </div>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const ready = SurveyState.areDefsFetched(state)
  const hierarchy = Survey.getHierarchy()(survey)
  const lang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return {
    hierarchy,
    lang,
    ready,
  }
}

export default connect(mapStateToProps)(SurveyHierarchy)