import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'

import * as Taxonomy from '@core/survey/taxonomy'

import { State } from '../state'

export const useEdit = () => {
  const navigate = useNavigate()
  const inTaxonomiesPath = useIsTaxonomiesRoute()

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    if (!inTaxonomiesPath) {
      const onTaxonomyOpen = State.getOnTaxonomyOpen(state)
      if (onTaxonomyOpen) {
        onTaxonomyOpen(taxonomy)
      }
    } else {
      navigate(`${appModuleUri(designerModules.taxonomy)}${taxonomyUuid}/`)
    }
  }, [])
}
