import './SurveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import DisplayTypeSelector from '@webapp/components/survey/DisplayTypeSelector'

import Tree from './Tree'

const SurveyHierarchy = () => {
  const i18n = useI18n()
  const survey = useSurvey()

  const { lang } = i18n
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)
  const [tree, setTree] = useState(null)
  const [[nodeDefDisplayType], setNodeDefDisplayType] = useState([NodeDef.getLabel])

  const treeRef = useRef(null)

  useEffect(() => {
    const treeElement = treeRef.current
    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
  }, [lang])

  useEffect(() => {
    return () => tree?.disconnect()
  }, [tree])

  useEffect(() => {
    tree?.changeNodeDefDisplayType(nodeDefDisplayType)
  }, [nodeDefDisplayType, tree])

  const toggleLabelFunction = () => {
    setNodeDefDisplayType([nodeDefDisplayType === NodeDef.getLabel ? NodeDef.getName : NodeDef.getLabel])
  }

  return (
    <div className="survey-hierarchy">
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
          nodeDefDisplayType={nodeDefDisplayType}
        />
      </div>
      <div className="survey-hierarchy__label-selector">
        <DisplayTypeSelector displayType={nodeDefDisplayType} onChange={toggleLabelFunction} />
      </div>
    </div>
  )
}

export default SurveyHierarchy
