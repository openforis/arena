import React from 'react'
import { useDispatch } from 'react-redux'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { matchPath, useHistory, useLocation } from 'react-router'

import * as TaxonomyActions from '@webapp/views/App/views/Designer/TaxonomyDetail/actions'

import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'

const HeaderLeft = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const history = useHistory()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const add = async () => {
    const taxonomy = await dispatch(TaxonomyActions.createTaxonomy())
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomy)}/`)
    }
  }

  return (
    <div>
      <button type="button" onClick={add} className="btn btn-s">
        <span className="icon icon-plus icon-12px icon-left" />
        {i18n.t('common.add')}
      </button>
    </div>
  )
}

export default HeaderLeft
