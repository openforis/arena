import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

const TableHeaderLeft = (props) => {
  const { headerProps } = props
  const { inCategoriesPath, onCategoryCreate } = headerProps

  const i18n = useI18n()
  const history = useHistory()

  const onAdd = async () => {
    if (inCategoriesPath) {
      history.push(appModuleUri(designerModules.category))
    } else {
      onCategoryCreate()
    }
  }

  return (
    <button type="button" className="btn btn-s" onClick={onAdd}>
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.new')}
    </button>
  )
}

TableHeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

TableHeaderLeft.defaultProps = {
  headerProps: {},
}

export default TableHeaderLeft
