import './SurveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

import Tree from './Tree'

const SurveyHierarchy = () => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity)(survey)

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)
  const [tree, setTree] = useState(null)
  const [nodeDefLabelType, setNodeDefLabelType] = useState(NodeDef.NodeDefLabelTypes.label)

  const treeRef = useRef(null)

  useEffect(() => {
    const treeElement = treeRef.current
    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
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

  const toggleLabelFunction = () => {
    setNodeDefLabelType(
      nodeDefLabelType === NodeDef.NodeDefLabelTypes.label
        ? NodeDef.NodeDefLabelTypes.name
        : NodeDef.NodeDefLabelTypes.label
    )
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
          nodeDefLabelType={nodeDefLabelType}
        />
      </div>
      <div className="survey-hierarchy__label-selector">
        <NodeDefLabelSwitch labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>
    </div>
  )
}

export default SurveyHierarchy
