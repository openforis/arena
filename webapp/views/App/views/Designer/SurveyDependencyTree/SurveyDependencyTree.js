import './SurveyDependencyTree.scss'

import React, { useState, useRef, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import { SurveyDependencyTreeChart } from './SurveyDependencyTreeChart'
import { ButtonGroup } from '@webapp/components/form'

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

const dependencyTypesItems = [
  Survey.dependencyTypes.applicable,
  Survey.dependencyTypes.defaultValues,
  Survey.dependencyTypes.itemsFilter,
  Survey.dependencyTypes.minCount,
  Survey.dependencyTypes.maxCount,
].map((key) => ({ key, label: `${key}` }))

const colorByDependencyType = {
  [Survey.dependencyTypes.applicable]: 'red',
  [Survey.dependencyTypes.defaultValues]: 'green',
}

export const SurveyDependencyTree = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const [dependencyTypes, setDependencyTypes] = useState([Survey.dependencyTypes.defaultValues])

  const hierarchy = useMemo(() => {
    const dependencyGraphFull = Survey.getDependencyGraph(survey)
    const dependencyNodeDefsByUuid = dependencyTypes.reduce((acc, dependencyType) => {
      const dependencyGraph = dependencyGraphFull[dependencyType] ?? {}
      Object.assign(acc, calculateDependentNodeDefsByUuid({ dependencyGraph, survey }))
      return acc
    }, {})
    return Survey.getHierarchy((nodeDef) => !!dependencyNodeDefsByUuid[NodeDef.getUuid(nodeDef)], cycle)(survey)
  }, [cycle, dependencyTypes, survey])

  const extraLinksGroups = useMemo(() => {
    const dependencyGraphFull = Survey.getDependencyGraph(survey)
    return dependencyTypes.reduce((acc, dependencyType) => {
      const dependencyGraph = dependencyGraphFull[dependencyType]
      const links = generateExtraLinks({ dependencyGraph })
      acc.push({ key: dependencyType, links, color: colorByDependencyType[dependencyType] })
      return acc
    }, [])
  }, [dependencyTypes, survey])

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)

  const treeRef = useRef(null)

  return (
    <div className="survey-hierarchy">
      <div className="survey-hierarchy__button-bar">
        <ButtonGroup
          multiple
          onChange={setDependencyTypes}
          selectedItemKey={dependencyTypes}
          items={dependencyTypesItems}
        />
        <SurveySchemaSummaryDownloadButton />

        <NodeDefLabelSwitch className="btn-s" labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>

      <div className="survey-hierarchy__center">
        <SurveyDependencyTreeChart
          ref={treeRef}
          data={hierarchy?.root}
          extraLinksGroups={extraLinksGroups}
          nodeDefLabelType={nodeDefLabelType}
          onEntityClick={setSelectedNodeDefUuid}
        />
      </div>
    </div>
  )
}
