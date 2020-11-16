import './SurveyHierarchy.scss'

import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui'

import { NodeDefsSelector } from '@webapp/components/survey/NodeDefsSelector'
import ItemLabelFunctionSelector from '@webapp/components/survey/ItemLabelFunctionSelector'

import Tree from './Tree'

const SurveyHierarchy = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const itemLabelFunction = useSelector(SurveyFormState.getNodeDefLabel)

  const { lang } = i18n
  const hierarchy = Survey.getHierarchy(NodeDef.isEntity, true)(survey)

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)
  const [tree, setTree] = useState(null)

  const treeRef = useRef(null)

  useEffect(() => {
    const treeElement = treeRef.current
    setTree(new Tree(treeElement, hierarchy.root, lang, setSelectedNodeDefUuid))
  }, [lang])

  useEffect(() => {
    return () => tree?.disconnect()
  }, [tree])

  useEffect(() => {
    tree?.changeLabelFunction(itemLabelFunction)
  }, [itemLabelFunction, tree])

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
        />
      </div>
      <div className="survey-hierarchy__label-selector">
        <ItemLabelFunctionSelector />
      </div>
    </div>
  )
}

export default SurveyHierarchy
