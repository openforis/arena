import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import { State as ListState } from './store'

const TableHeaderLeft = (props) => {
  const { headerProps } = props
  const { listState } = headerProps

  const i18n = useI18n()
  const history = useHistory()

  const onAdd = () => {
    if (ListState.isInCategoriesPath(listState)) {
      history.push(appModuleUri(designerModules.category))
    } else {
      const onCreate = ListState.getOnAdd(listState)
      if (onCreate) {
        onCreate()
      }
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
