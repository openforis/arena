import './surveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import NodeDefsSelectorView from '../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'
import Tree from './surveyHierarchyTree'

const SurveyHierarchy = props => {
  const { lang, hierarchy } = props

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)
  const [tree, setTree] = useState(null)
  const treeRef = useRef(null)

  useEffect(() => {
    const treeElement = treeRef.current
    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
  }, [lang])

  useEffect(() => {
    return () => tree && tree.disconnect()
  }, [tree])

  return (
    <div className="survey-hierarchy">
      <div className="survey-hierarchy__tree" ref={treeRef} />

      <div className="survey-hierarchy__attributes">
        <NodeDefsSelectorView
          hierarchy={hierarchy}
          nodeDefUuidEntity={selectedNodeDefUuid}
          onChangeEntity={nodeDefUuidEntity => tree.expandToNode(nodeDefUuidEntity)}
          canSelectAttributes={false}
          showAncestors={false}
        />
      </div>
    </div>
  )
}

const mapStateToProps = state => {
  const lang = AppState.getLang(state)
  const survey = SurveyState.getSurvey(state)
  const hierarchy = Survey.getHierarchy()(survey)

  return {
    lang,
    hierarchy,
  }
}

export default connect(mapStateToProps)(SurveyHierarchy)
