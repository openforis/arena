import { useCallback } from 'react'
import { useHistory } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'

import * as Taxonomy from '@core/survey/taxonomy'

import { State } from '../state'

export const useEdit = () => {
  const history = useHistory()
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
      history.push(`${appModuleUri(designerModules.taxonomy)}${taxonomyUuid}/`)
    }
  }, [])
}
