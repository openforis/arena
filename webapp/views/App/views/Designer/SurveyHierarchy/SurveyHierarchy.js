import './SurveyHierarchy.scss'

import React, { useEffect, useRef, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

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

        <NodeDefLabelSwitch className="btn-s" labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>

      <div className="survey-hierarchy__center">
        <div className="survey-hierarchy__tree" ref={treeRef} />

        <div className="survey-hierarchy__attributes">
          <NodeDefsSelector
            canSelectAttributes={false}
            hierarchy={hierarchy}
            nodeDefLabelType={nodeDefLabelType}
            nodeDefUuidEntity={selectedNodeDefUuid}
            onChangeEntity={(nodeDefUuidEntity) => {
              tree.expandToNode(nodeDefUuidEntity)
              setSelectedNodeDefUuid(nodeDefUuidEntity)
            }}
            showAncestors={false}
            showSingleEntities
          />
        </div>
      </div>
    </div>
  )
}

export default SurveyHierarchy
