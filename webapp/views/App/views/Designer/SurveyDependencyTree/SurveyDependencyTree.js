import './SurveyDependencyTree.scss'

import React, { useState, useRef, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import { SurveyDependencyTreeChart } from './SurveyDependencyTreeChart'

const generateExtraLinks = ({ dependencyGraph }) =>
  Object.entries(dependencyGraph).reduce((acc, [source, dependentNodeDefUuids]) => {
    dependentNodeDefUuids.forEach((target) => {
      acc.push({ source, target })
    })
    return acc
  }, [])

const calculateDependentNodeDefsByUuid = ({ dependencyGraph, survey }) =>
  Object.entries(dependencyGraph).reduce((acc, [nodeDefUuid, dependentNodeDefUuids]) => {
    if (!dependentNodeDefUuids.length) {
      return acc
    }
    const nodeDefUuids = [nodeDefUuid, ...dependentNodeDefUuids]
    nodeDefUuids.forEach((uuid) => {
      if (!acc[uuid]) {
        const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
        Survey.visitAncestorsAndSelf(nodeDef, (nd) => {
          acc[NodeDef.getUuid(nd)] = nd
        })(survey)
      }
    })
    return acc
  }, {})

export const SurveyDependencyTree = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const [dependencyType, setDependencyType] = useState(Survey.dependencyTypes.applicable)

  const dependencyGraphFull = Survey.getDependencyGraph(survey)
  const dependencyGraph = dependencyGraphFull[dependencyType]

  const hierarchy = useMemo(() => {
    const dependencyNodeDefsByUuid = calculateDependentNodeDefsByUuid({ dependencyGraph, survey })
    const _hierarchy = Survey.getHierarchy(
      (nodeDef) => !!dependencyNodeDefsByUuid[NodeDef.getUuid(nodeDef)],
      cycle
    )(survey)
    Survey.traverseHierarchyItemSync(_hierarchy.root, (nodeDefItem) => {
      const uuid = NodeDef.getUuid(nodeDefItem)
      nodeDefItem.dependents = dependencyGraph[uuid]
    })
    return _hierarchy
  }, [cycle, dependencyGraph, survey])

  const extraLinks = useMemo(() => generateExtraLinks({ dependencyGraph }), [dependencyGraph])

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)

  const treeRef = useRef(null)

  return (
    <div className="survey-hierarchy">
      <div className="survey-hierarchy__button-bar">
        <SurveySchemaSummaryDownloadButton />

        <NodeDefLabelSwitch className="btn-s" labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>

      <div className="survey-hierarchy__center">
        <SurveyDependencyTreeChart
          ref={treeRef}
          data={hierarchy?.root}
          extraLinks={extraLinks}
          nodeDefLabelType={nodeDefLabelType}
          onEntityClick={setSelectedNodeDefUuid}
        />
      </div>
    </div>
  )
}
