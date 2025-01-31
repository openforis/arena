import './SurveyDependencyTree.scss'

import React, { useState, useRef, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

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

const dependencyTypesItems = [
  Survey.dependencyTypes.applicable,
  Survey.dependencyTypes.defaultValues,
  Survey.dependencyTypes.validations,
  Survey.dependencyTypes.itemsFilter,
  Survey.dependencyTypes.minCount,
  Survey.dependencyTypes.maxCount,
].map((key) => ({ key, label: `surveyDependencyTreeView.dependencyTypes.${key}` }))

const colorByDependencyType = {
  [Survey.dependencyTypes.applicable]: 'green',
  [Survey.dependencyTypes.defaultValues]: 'blue',
  [Survey.dependencyTypes.validations]: 'red',
  [Survey.dependencyTypes.itemsFilter]: 'brown',
  [Survey.dependencyTypes.minCount]: 'orange',
  [Survey.dependencyTypes.maxCount]: 'yellow',
}

const determineMessage = ({ hierarchy, dependencyTypes }) => {
  if (!dependencyTypes?.length) return 'surveyDependencyTreeView.selectAtLeastOneDependencyType'
  if (hierarchy.length <= 1) return 'surveyDependencyTreeView.noDependenciesToDisplay'
  return null
}

export const SurveyDependencyTree = () => {
  const i18n = useI18n()
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
      const dependencyGraph = dependencyGraphFull[dependencyType] ?? {}
      const links = generateExtraLinks({ dependencyGraph })
      acc.push({ key: dependencyType, links, color: colorByDependencyType[dependencyType] })
      return acc
    }, [])
  }, [dependencyTypes, survey])

  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)

  const treeRef = useRef(null)

  const message = determineMessage({ hierarchy, dependencyTypes })

  return (
    <div className="survey-dependency-tree">
      <div className="survey-dependency-tree__button-bar">
        <FormItem label="surveyDependencyTreeView.dependencyTypesLabel">
          <ButtonGroup
            multiple
            onChange={setDependencyTypes}
            selectedItemKey={dependencyTypes}
            items={dependencyTypesItems}
          />
        </FormItem>

        <div className="spacer" />

        <SurveySchemaSummaryDownloadButton />

        <NodeDefLabelSwitch className="btn-s" labelType={nodeDefLabelType} onChange={toggleLabelFunction} />
      </div>

      <div className="survey-dependency-tree__center">
        {message ? (
          <span className="message">{i18n.t(message)}</span>
        ) : (
          <SurveyDependencyTreeChart
            ref={treeRef}
            data={hierarchy?.root}
            extraLinksGroups={extraLinksGroups}
            nodeDefLabelType={nodeDefLabelType}
            onEntityClick={setSelectedNodeDefUuid}
          />
        )}
      </div>
    </div>
  )
}
