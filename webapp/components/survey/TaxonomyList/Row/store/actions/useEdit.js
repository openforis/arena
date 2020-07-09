import { useCallback } from 'react'
import { matchPath, useHistory, useLocation } from 'react-router'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as Taxonomy from '@core/survey/taxonomy'

import { State } from '../state'

export const useEdit = () => {
  const history = useHistory()
  const { pathname } = useLocation()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    if (!inTaxonomiesPath) {
      const onOpenTaxonomy = State.getOnOpenTaxonomy(state)
      if (onOpenTaxonomy) {
        onOpenTaxonomy(taxonomy)
      }
    } else {
      history.push(`${appModuleUri(designerModules.taxonomy)}${taxonomyUuid}/`)
    }
  }, [])
}
