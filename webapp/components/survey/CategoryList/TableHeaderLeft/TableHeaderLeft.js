import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'
import { useIsCategoriesRoute } from '@webapp/components/hooks'
import { ButtonDownload } from '@webapp/components/buttons'

import { designerModules, appModuleUri } from '@webapp/app/appModules'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { useActions, State } from '../store'

const TableHeaderLeft = (props) => {
  const { headerProps } = props
  const { state } = headerProps
  const history = useHistory()

  const Actions = useActions({})

  const inCategoriesPath = useIsCategoriesRoute()
  const canEditSurvey = useAuthCanEditSurvey()

  const onAdd = (categoryCreated) => {
    if (inCategoriesPath) {
      history.push(`${appModuleUri(designerModules.category)}${Category.getUuid(categoryCreated)}`)
    } else {
      const onCreate = State.getOnCategoryCreated(state)
      if (onCreate) {
        onCreate(categoryCreated)
      }
    }
  }

  if (!canEditSurvey) {
    // placeholder to avoid breaking the header layout
    return <div></div>
  }

  return (
    <>
      <ButtonMetaItemAdd onAdd={onAdd} metaItemType={metaItemTypes.category} />

      <ButtonDownload label="common.export" onClick={Actions.exportAll} />
    </>
  )
}

TableHeaderLeft.propTypes = {
  headerProps: PropTypes.object,
}

TableHeaderLeft.defaultProps = {
  headerProps: {},
}

export default TableHeaderLeft
