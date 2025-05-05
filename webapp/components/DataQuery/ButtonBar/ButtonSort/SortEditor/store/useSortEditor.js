import { useEffect, useMemo, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import { Query, Sort } from '@common/model/query'
import * as Expression from '@core/expressionParser/expression'

import * as ExpressionVariables from '@webapp/components/expression/expressionVariables'

import { useLang } from '@webapp/store/system'
import { useNodeDefByUuid, useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

const getVariables = async ({ survey, cycle, entityDef, attributeDefUuids, lang }) => {
  const variables = await ExpressionVariables.getVariables({
    survey,
    cycle,
    nodeDefContext: entityDef,
    mode: Expression.modes.sql,
    lang,
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

export const useSortEditor = ({ query }) => {
  const sort = Query.getSort(query)
  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.isModeAggregate(query)
    ? Query.getDimensions(query)
    : Query.getAttributeDefUuids(query)

  const lang = useLang()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const entityDef = useNodeDefByUuid(entityDefUuid)

  const [draft, setDraft] = useState(false)
  const [sortDraft, setSortDraft] = useState(sort)
  const [variables, setVariables] = useState([])
  useEffect(() => {
    if (survey && entityDef && attributeDefUuids && lang) {
      setVariables(getVariables({ survey, cycle, entityDef, attributeDefUuids, lang }))
    }
  }, [survey, cycle, entityDef, attributeDefUuids, lang])

  const variablesAvailable = useMemo(
    () => variables.filter(({ value }) => !Sort.containsVariable(value)(sortDraft)),
    [sortDraft, variables]
  )

  return {
    draft,
    sort,
    sortDraft,
    variables,
    variablesAvailable,
    setSortDraft: (sortUpdated) => {
      setSortDraft(sortUpdated)
      setDraft(true)
    },
  }
}
