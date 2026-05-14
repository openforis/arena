import './SurveyDependencyTree.scss'

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import NodeDefLabelSwitch, { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import SurveySchemaSummaryDownloadButton from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { SurveyDependencyTreeChart } from './SurveyDependencyTreeChart'

const { dependencyTypes: surveyDependencyTypes } = Survey

const generateExtraLinks = ({ dependencyGraph, selectedNodeDefUuid }) =>
  Object.entries(dependencyGraph).reduce((acc, [source, dependentNodeDefUuids]) => {
    if (selectedNodeDefUuid && source !== selectedNodeDefUuid && !dependentNodeDefUuids.includes(selectedNodeDefUuid)) {
      return acc
    }
    const uniqueDependentNodeDefUuids = [...new Set(dependentNodeDefUuids)]
    uniqueDependentNodeDefUuids.forEach((target) => {
      acc.push({ source, target })
    })
    return acc
  }, [])

const calculateDependentNodeDefsByUuid = ({ survey, dependencyGraph, selectedNodeDefUuid }) =>
  Object.entries(dependencyGraph).reduce((acc, [nodeDefUuid, dependentNodeDefUuids]) => {
    if (!dependentNodeDefUuids.length) {
      return acc
    }
    const sourceAndDependentUuids = [nodeDefUuid, ...dependentNodeDefUuids]
    const nodeDefUuids =
      !selectedNodeDefUuid || nodeDefUuid === selectedNodeDefUuid
        ? sourceAndDependentUuids
        : dependentNodeDefUuids.includes(selectedNodeDefUuid)
          ? [nodeDefUuid, selectedNodeDefUuid]
          : []

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

const colorByDependencyType = {
  [surveyDependencyTypes.applicable]: 'lightgrey',
  [surveyDependencyTypes.defaultValues]: 'blue',
  [surveyDependencyTypes.editable]: 'purple',
  [surveyDependencyTypes.fileName]: 'lightgreen',
  [surveyDependencyTypes.itemsFilter]: 'green',
  [surveyDependencyTypes.maxCount]: 'yellow',
  [surveyDependencyTypes.minCount]: 'orange',
  [surveyDependencyTypes.parentCode]: 'lightblue',
  [surveyDependencyTypes.validations]: 'red',
  [surveyDependencyTypes.visible]: 'pink',
}

// The order of dependency types in the UI is determined by the order of items in this array
const dependencyTypesShown = [
  surveyDependencyTypes.applicable,
  surveyDependencyTypes.defaultValues,
  surveyDependencyTypes.editable,
  surveyDependencyTypes.visible,
  surveyDependencyTypes.validations,
  surveyDependencyTypes.minCount,
  surveyDependencyTypes.maxCount,
  surveyDependencyTypes.parentCode,
  surveyDependencyTypes.itemsFilter,
  surveyDependencyTypes.fileName,
]

const dependencyTypesItems = dependencyTypesShown.map((key) => ({
  key,
  label: `surveyDependencyTreeView.dependencyTypes.${key}`,
  icon: <span className="dependency-icon" style={{ backgroundColor: colorByDependencyType[key] }} />,
}))

const determineMessage = ({ hierarchy, dependencyTypes }) => {
  if (!dependencyTypes?.length) return 'surveyDependencyTreeView.selectAtLeastOneDependencyType'
  if (hierarchy.length <= 1) return 'surveyDependencyTreeView.noDependenciesToDisplay'
  return null
}

const useSurveyWithDependencyGraph = () => {
  const survey = useSurvey()

  const [state, setState] = useState({
    ready: false,
    survey,
  })

  const fetchSurveyWithDependencyGraph = useCallback(async () => Survey.buildAndAssocDependencyGraph(survey), [survey])

  useEffect(() => {
    fetchSurveyWithDependencyGraph().then((surveyUpdated) => setState({ ready: true, survey: surveyUpdated }))
  }, [fetchSurveyWithDependencyGraph])

  return state
}

export const SurveyDependencyTree = () => {
  const i18n = useI18n()
  const { ready, survey } = useSurveyWithDependencyGraph()
  const cycle = useSurveyCycleKey()
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const [dependencyTypes, setDependencyTypes] = useState([])
  const [selectedNodeDefUuid, setSelectedNodeDefUuid] = useState(null)

  const hierarchy = useMemo(() => {
    if (!ready) return {}
    const dependencyGraphFull = Survey.getDependencyGraph(survey)

    const dependencyNodeDefsByUuid = dependencyTypes.reduce((acc, dependencyType) => {
      const dependencyGraph = dependencyGraphFull[dependencyType] ?? {}
      Object.assign(acc, calculateDependentNodeDefsByUuid({ survey, dependencyGraph, selectedNodeDefUuid }))
      return acc
    }, {})
    return Survey.getHierarchy((nodeDef) => !!dependencyNodeDefsByUuid[NodeDef.getUuid(nodeDef)], cycle)(survey)
  }, [cycle, dependencyTypes, ready, selectedNodeDefUuid, survey])

  const extraLinksGroups = useMemo(() => {
    const dependencyGraphFull = Survey.getDependencyGraph(survey)
    return dependencyTypes.reduce((acc, dependencyType) => {
      const dependencyGraph = dependencyGraphFull[dependencyType] ?? {}
      const links = generateExtraLinks({ dependencyGraph, selectedNodeDefUuid })
      acc.push({ key: dependencyType, links, color: colorByDependencyType[dependencyType] })
      return acc
    }, [])
  }, [dependencyTypes, selectedNodeDefUuid, survey])

  // If the selected node is not in the hierarchy anymore, deselect it
  useEffect(() => {
    if (hierarchy.length <= 1 && selectedNodeDefUuid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedNodeDefUuid(null)
    }
  }, [hierarchy.length, selectedNodeDefUuid])

  const treeRef = useRef(null)

  const message = determineMessage({ hierarchy, dependencyTypes })

  const onNodeClick = useCallback(
    (nodeDefUuid) => {
      setSelectedNodeDefUuid(selectedNodeDefUuid === nodeDefUuid ? null : nodeDefUuid)
    },
    [selectedNodeDefUuid]
  )

  if (!ready) {
    return null
  }

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
            onNodeClick={onNodeClick}
            selectedNodeUuid={selectedNodeDefUuid}
          />
        )}
      </div>
    </div>
  )
}
