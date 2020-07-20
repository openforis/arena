import React from 'react'
import PropTypes from 'prop-types'
import { matchPath, useHistory, useLocation } from 'react-router'

import * as Taxonomy from '@core/survey/taxonomy'

import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

const HeaderLeft = (props) => {
  const { headerProps } = props
  const { onTaxonomyCreated } = headerProps

  const history = useHistory()
  const { pathname } = useLocation()

  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const onAdd = (taxonomyCreated) => {
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomyCreated)}`)
    } else {
      onTaxonomyCreated(taxonomyCreated)
    }
  }

  return (
    <div>
      <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.taxonomy} />
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
