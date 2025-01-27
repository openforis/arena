import './SurveyHierarchy.scss'

import React, { useState, useRef } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'

import { SurveyHierarchyTree } from './SurveyHierarchyTree'

const SurveyHierarchy = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()

  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, cycle)(survey)

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)

  const treeRef = useRef(null)

  return (
    <div className="survey-hierarchy">
      <div className="survey-hierarchy__button-bar">
        <SurveySchemaSummaryDownloadButton />

        <NodeDefLabelSwitch className="btn-s" labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>

      <div className="survey-hierarchy__center">
        <SurveyHierarchyTree
          ref={treeRef}
          data={hierarchy?.root}
          nodeDefLabelType={nodeDefLabelType}
          onEntityClick={setSelectedNodeDefUuid}
        />
        <div className="survey-hierarchy__attributes">
          <NodeDefsSelector
            canSelectAttributes={false}
            hierarchy={hierarchy}
            nodeDefLabelType={nodeDefLabelType}
            nodeDefUuidEntity={selectedNodeDefUuid}
            onChangeEntity={(nodeDefUuidEntity) => {
              treeRef.current.expandToNode(nodeDefUuidEntity)
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
