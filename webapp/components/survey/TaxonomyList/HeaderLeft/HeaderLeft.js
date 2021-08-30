import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import * as Taxonomy from '@core/survey/taxonomy'

import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useIsTaxonomiesRoute } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'

const HeaderLeft = (props) => {
  const { headerProps } = props
  const { onTaxonomyCreated } = headerProps

  const history = useHistory()

  const inTaxonomiesPath = useIsTaxonomiesRoute()

  const canEditSurvey = useAuthCanEditSurvey()

  const onAdd = (taxonomyCreated) => {
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomyCreated)}`)
    } else {
      onTaxonomyCreated(taxonomyCreated)
    }
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  return <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.taxonomy} />
}

HeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

HeaderLeft.defaultProps = {
  headerProps: {},
}

export default HeaderLeft
