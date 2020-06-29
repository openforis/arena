import { useState } from 'react'

import { Query, Sort } from '@common/model/query'
import * as Expression from '@core/expressionParser/expression'
import * as ExpressionVariables from '@webapp/components/expression/expressionVariables'

import { useLang } from '@webapp/store/system'
import { useNodeDefByUuid, useSurvey } from '@webapp/store/survey'

const getVariables = ({ survey, entityDef, attributeDefUuids, lang }) =>
  ExpressionVariables.getVariables(survey, entityDef, null, Expression.modes.sql, lang).filter((variable) =>
    attributeDefUuids.includes(variable.uuid)
  )

export const useSortEditor = ({ query }) => {
  const sort = Query.getSort(query)
  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)

  const lang = useLang()
  const survey = useSurvey()
  const entityDef = useNodeDefByUuid(entityDefUuid)

  const [draft, setDraft] = useState(false)
  const [sortDraft, setSortDraft] = useState(sort)
  const [variables] = useState(getVariables({ survey, entityDef, attributeDefUuids, lang }))
  const variablesAvailable = variables.filter(({ value }) => !Sort.containsVariable(value)(sortDraft))

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
