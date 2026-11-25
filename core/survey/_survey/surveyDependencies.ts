import type {
  ArenaNodeDefMap,
  ArenaSurvey,
  ArenaSurveyDependencyGraph,
  SurveyDependencyType,
} from '@openforis/arena-core'
import { ArenaAnyNodeDef, Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'

import type { DependencyType } from './surveyDependencyTypes'

export { dependencyTypes } from './surveyDependencyTypes'

type SurveyUpdater = (survey: ArenaSurvey) => ArenaSurvey

const keys = {
  dependencyGraph: 'dependencyGraph',
} as const

// arena dependency types are a superset of the arena-core ones (e.g. itemsFilter): same string values
const toCoreDependencyType = (dependencyType: DependencyType | null): SurveyDependencyType | undefined =>
  (dependencyType ?? undefined) as SurveyDependencyType | undefined

// READ
export const getDependencyGraph = (survey: ArenaSurvey): ArenaSurveyDependencyGraph =>
  A.propOr({}, keys.dependencyGraph)(survey) as ArenaSurveyDependencyGraph

export const hasDependencyGraph = (survey: ArenaSurvey): boolean => {
  const graph = getDependencyGraph(survey)
  return !A.isEmpty(graph)
}

export const getNodeDefDependencies =
  (nodeDefUuid: string, dependencyType: DependencyType | null = null) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType: toCoreDependencyType(dependencyType) })

export const getNodeDefDependentsUuids =
  (nodeDefUuid: string, dependencyType: DependencyType | null = null) =>
  (survey: ArenaSurvey): string[] =>
    getNodeDefDependencies(nodeDefUuid, dependencyType)(survey).map(NodeDef.getUuid)

/**
 * Determines if the specified nodeDefUuid is among the dependencies of the specified nodeDefSourceUuid.
 * @param nodeDefUuid - The uuid of the node definition to look for.
 * @param nodeDefSourceUuid - The uuid of the node definition to use as source of the dependency.
 * @returns Function returning true if the dependency is found in the specified survey, false otherwise.
 */
export const isNodeDefDependentOn =
  (nodeDefUuid: string, nodeDefSourceUuid: string) =>
  (survey: ArenaSurvey): boolean => {
    if (nodeDefUuid === nodeDefSourceUuid) {
      return false
    }

    const stack: string[] = [nodeDefSourceUuid]
    const visitedUuids = new Set<string>()

    while (stack.length > 0) {
      const nodeDefUuidCurrent = stack.pop()

      if (nodeDefUuid === nodeDefUuidCurrent) {
        return true
      }

      visitedUuids.add(nodeDefUuidCurrent)

      for (const nodeDefDependent of getNodeDefDependencies(nodeDefUuidCurrent)(survey)) {
        if (!visitedUuids.has(nodeDefDependent.uuid)) {
          stack.push(nodeDefDependent.uuid)
        }
      }
    }

    return false
  }

// UPDATE
export const assocDependencyGraph =
  (dependencyGraph: ArenaSurveyDependencyGraph): SurveyUpdater =>
  (survey) =>
    A.assoc(keys.dependencyGraph, dependencyGraph, survey)

// ====== CREATE
export const addNodeDefDependencies =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): Promise<ArenaSurvey> =>
    Surveys.addNodeDefDependencies({ nodeDef, survey })

export const addNodeDefsDependencies =
  (nodeDefsIndexedByUuid: ArenaNodeDefMap) =>
  async (survey: ArenaSurvey): Promise<ArenaSurvey> => {
    let surveyUpdated = survey
    for (const nodeDef of Object.values(nodeDefsIndexedByUuid)) {
      surveyUpdated = await addNodeDefDependencies(nodeDef)(surveyUpdated) // NOSONAR
    }
    return surveyUpdated
  }

export const buildGraph = async (survey: ArenaSurvey): Promise<ArenaSurveyDependencyGraph> => {
  const surveyUpdated = await Surveys.buildAndAssocDependencyGraph(survey)
  return getDependencyGraph(surveyUpdated)
}

export const buildAndAssocDependencyGraph = (survey: ArenaSurvey): Promise<ArenaSurvey> =>
  Surveys.buildAndAssocDependencyGraph({ ...survey })

// DELETE
export const removeNodeDefDependencies =
  (nodeDefUuid: string, dependencyType: DependencyType | null = null): SurveyUpdater =>
  (survey) =>
    Surveys.removeNodeDefDependencies({ survey, nodeDefUuid, dependencyType: toCoreDependencyType(dependencyType) })
