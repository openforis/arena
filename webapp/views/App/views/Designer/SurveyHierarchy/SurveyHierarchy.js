import './SurveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'

import Tree from './Tree'

const SurveyHierarchy = () => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const i18n = useI18n()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()

  const hierarchy = Survey.getHierarchy(NodeDef.isEntity)(survey)

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)
  const [tree, setTree] = useState(null)

  const treeRef = useRef(null)

  useEffect(() => {
    const treeElement = treeRef.current
    setTree(
      new Tree({ domElement: treeElement, data: hierarchy.root, lang, i18n, onEntityClick: setSelectedNodeDefUuid })
    )
  }, [])

  useEffect(() => {
    return () => tree?.disconnect()
  }, [tree])

  useEffect(() => {
    if (tree) tree.nodeDefLabelType = nodeDefLabelType
  }, [nodeDefLabelType, tree])

  useEffect(() => {
    if (tree) tree.lang = lang
  }, [lang, tree])

  return (
    <div className="survey-hierarchy">
      <div className="survey-hierarchy__button-bar">
        <SurveySchemaSummaryDownloadButton />

        <NodeDefLabelSwitch
          className="btn-s btn-transparent"
          labelType={nodeDefLabelType}
          onChange={toggleLabelFunction}
        />
      </div>

      <div className="survey-hierarchy__center">
        <div className="survey-hierarchy__tree" ref={treeRef} />

        <div className="survey-hierarchy__attributes">
          <NodeDefsSelector
            hierarchy={hierarchy}
            nodeDefUuidEntity={selectedNodeDefUuid}
            onChangeEntity={(nodeDefUuidEntity) => {
              tree.expandToNode(nodeDefUuidEntity)
              setSelectedNodeDefUuid(nodeDefUuidEntity)
            }}
            canSelectAttributes={false}
            showAncestors={false}
            nodeDefLabelType={nodeDefLabelType}
          />
        </div>
      </div>
    </div>
  )
}

export default SurveyHierarchy
