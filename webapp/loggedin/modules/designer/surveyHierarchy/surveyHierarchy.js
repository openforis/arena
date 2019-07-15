import './surveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../common/survey/survey'

import * as SurveyState from '../../../../survey/surveyState'

import Tree from './surveyHierarchyTree'
import NodeDefsSelectorView from '../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'

import useI18n from '../../../../commonComponents/useI18n'

const SurveyHierarchy = props => {

  const { surveyInfo, hierarchy, ready } = props

  const [ selectedNodeDefUuid, setSelectedNodeDefUuid ] = useState(null)
  const [ tree, setTree ] = useState(null)
  const treeRef = useRef(null)

  const i18n = useI18n()

  useEffect(() => {
    const lang = Survey.getLanguage(i18n.lang)(surveyInfo)
    const treeElement = treeRef.current

    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
  }, [ready, i18n.lang])

  useEffect(() => {
    return () => tree && tree.terminate()
  }, [tree])

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
  const surveyInfo = Survey.getSurveyInfo(survey)
  const ready = SurveyState.areDefsFetched(state)
  const hierarchy = Survey.getHierarchy()(survey)

  return {
    surveyInfo,
    hierarchy,
    ready,
  }
}

export default connect(mapStateToProps)(SurveyHierarchy)