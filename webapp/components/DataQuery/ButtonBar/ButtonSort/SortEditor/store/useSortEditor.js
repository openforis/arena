import { useMemo, useState } from 'react'

import { Query, Sort } from '@common/model/query'

import { useQuerySortableVariables } from '@webapp/components/DataQuery/store'

export const useSortEditor = ({ query }) => {
  const sort = Query.getSort(query)

  const [draft, setDraft] = useState(false)
  const [sortDraft, setSortDraft] = useState(sort)
  const variables = useQuerySortableVariables({ query })

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
