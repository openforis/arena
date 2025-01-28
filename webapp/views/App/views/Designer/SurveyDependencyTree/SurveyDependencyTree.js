import './SurveyDependencyTree.scss'

import React, { useState, useRef } from 'react'

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

export const SurveyDependencyTree = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const [dependencyType, setDependencyType] = useState(Survey.dependencyTypes.applicable)

  const dependencyGraphFull = Survey.getDependencyGraph(survey)
  const dependencyGraph = dependencyGraphFull[dependencyType]
  const dependencyNodeDefsByUuid = Object.entries(dependencyGraph).reduce(
    (acc, [nodeDefUuid, dependentNodeDefUuids]) => {
      const nodeDefUuids = [nodeDefUuid, ...dependentNodeDefUuids]
      nodeDefUuids.forEach((uuid) => {
        if (!acc[uuid]) {
          const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
          Survey.visitAncestorsAndSelf(nodeDef, (nd) => {
            acc[NodeDef.getUuid(nd)] = nd
          })
        }
      })
      return acc
    },
    {}
  )

  const hierarchy = Survey.getHierarchy(
    (nodeDef) => NodeDef.isEntity(nodeDef) || NodeDef.isAttribute(nodeDef),
    cycle
  )(survey)

  const traverse = (nodeDefItem) => {
    const uuid = NodeDef.getUuid(nodeDefItem)
    nodeDefItem.dependents = dependencyGraph[uuid]
  }
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

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
          extraLinks={generateExtraLinks({ dependencyGraph })}
          nodeDefLabelType={nodeDefLabelType}
          onEntityClick={setSelectedNodeDefUuid}
        />
      </div>
    </div>
  )
}
