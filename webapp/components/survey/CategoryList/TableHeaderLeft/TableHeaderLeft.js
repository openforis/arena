import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'

import { State } from '../store'

const TableHeaderLeft = (props) => {
  const { headerProps } = props
  const { state } = headerProps
  const history = useHistory()

  const onAdd = (categoryCreated) => {
    if (State.isInCategoriesPath(state)) {
      history.push(`${appModuleUri(designerModules.category)}${Category.getUuid(categoryCreated)}`)
    } else {
      const onCreate = State.getOnAdd(state)
      if (onCreate) {
        onCreate(categoryCreated)
      }
    }
  }

  return <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.category} />
}

TableHeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

TableHeaderLeft.defaultProps = {
  headerProps: {},
}

export default TableHeaderLeft
