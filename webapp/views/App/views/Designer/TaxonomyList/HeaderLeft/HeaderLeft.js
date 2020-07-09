import React from 'react'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { matchPath, useHistory, useLocation } from 'react-router'

import { useI18n } from '@webapp/store/system'
import PropTypes from 'prop-types'

const HeaderLeft = (props) => {
  const i18n = useI18n()
  const { pathname } = useLocation()
  const history = useHistory()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const { headerProps } = props
  const { onTaxonomyCreated } = headerProps

  const add = async () => {
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}`)
    } else {
      onTaxonomyCreated()
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

HeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

HeaderLeft.defaultProps = {
  headerProps: {},
}

export default HeaderLeft
