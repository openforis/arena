import { useEffect, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import * as Expression from '@core/expressionParser/expression'

import * as ExpressionVariables from '@webapp/components/expression/expressionVariables'

import { useNodeDefByUuid, useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

const fetchVariables = async ({ survey, cycle, entityDef, attributeDefUuids, lang }) => {
  const variables = await ExpressionVariables.getVariables({
    survey,
    cycle,
    nodeDefContext: entityDef,
    mode: Expression.modes.sql,
    lang,
    includeAnalysis: true,
  })
  if (Objects.isEmpty(attributeDefUuids)) return variables

  const variablesByUuid = variables.reduce((acc, variable) => {
    const { uuid } = variable
    if (!acc[uuid]) {
      // keep only first variable
      // variables for composite attributes have same UUID for different properties (e.g. taxon)
      acc[uuid] = variable
    }
    return acc
  }, {})
  return attributeDefUuids.map((uuid) => variablesByUuid[uuid]).filter(Boolean)
}

export const useQuerySortableVariables = ({ query }) => {
  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.isModeAggregate(query)
    ? Query.getDimensions(query)
    : Query.getAttributeDefUuids(query)

  const lang = useSurveyPreferredLang()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const entityDef = useNodeDefByUuid(entityDefUuid)

  const prerequisitesReady = Boolean(survey && entityDef && attributeDefUuids && lang)

  const [variables, setVariables] = useState([])
  useEffect(() => {
    if (!prerequisitesReady) return undefined

    let active = true

    fetchVariables({ survey, cycle, entityDef, attributeDefUuids, lang }).then(
      (variablesFetched) => {
        if (active) setVariables(variablesFetched)
      },
      (error) => {
        if (active) setVariables([])
      }
    )

    return () => {
      active = false
    }
  }, [prerequisitesReady, survey, cycle, entityDef, attributeDefUuids, lang])

  return prerequisitesReady ? variables : []
}
