import React from 'react'
import PropTypes from 'prop-types'
import { matchPath, useHistory, useLocation } from 'react-router'

import * as Taxonomy from '@core/survey/taxonomy'

import ButtonTaxonomyAdd from '@webapp/components/survey/ButtonTaxonomyAdd'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

const HeaderLeft = (props) => {
  const { pathname } = useLocation()
  const history = useHistory()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const { headerProps } = props
  const { onTaxonomyCreated } = headerProps

  const onAdd = (taxonomyCreated) => {
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomyCreated)}`)
    } else {
      onTaxonomyCreated(taxonomyCreated)
    }
  }

  return (
    <div>
      <ButtonTaxonomyAdd onAdd={onAdd} />
    </div>
  )
}

HeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

HeaderLeft.defaultProps = {
  headerProps: {},
}

export default HeaderLeft
