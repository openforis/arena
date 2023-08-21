import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'

import { useSurvey } from '@webapp/store/survey'
import { useCallback, useEffect, useMemo } from 'react'
import { useItemsFilter } from './useItemsFilter'
import { useAsyncGetRequest } from '@webapp/components/hooks'
import { useRecord } from '@webapp/store/ui/record'

export const useTaxa = ({ nodeDef, draft, field, fieldValue, parentNode }) => {
  const survey = useSurvey()
  const surveyId = Survey.getId(survey)
  const record = useRecord()
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)

  const params = useMemo(
    () => ({
      filterProp: field,
      filterValue: fieldValue,
      includeUnlUnk: true,
      draft,
    }),
    [draft, field, fieldValue]
  )

  const { data: { list = [] } = { list: [] }, dispatch: fetchTaxa } = useAsyncGetRequest(
    `/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`,
    { params }
  )

  useEffect(() => {
    fetchTaxa()
  }, [fieldValue])

  const alwaysIncludeItemFunction = useCallback(
    (taxon) => Taxon.isUnknownTaxon(taxon) || Taxon.isUnlistedTaxon(taxon),
    []
  )

  return useItemsFilter({ survey, nodeDef, record, parentNode, items: list, alwaysIncludeItemFunction })
}
