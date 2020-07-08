import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

const TableHeaderLeft = (props) => {
  const { headerProps } = props
  const { inCategoriesPath, onSelect } = headerProps

  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const onAdd = async () => {
    const category = await dispatch(CategoryActions.createCategory())
    if (onSelect) {
      onSelect(category)
    }
    if (inCategoriesPath) {
      history.push(`${appModuleUri(designerModules.category)}${Category.getUuid(category)}`)
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
