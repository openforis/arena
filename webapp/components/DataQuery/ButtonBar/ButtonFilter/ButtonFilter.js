import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { ButtonIconFilter } from '@webapp/components/buttons'
import Tooltip from '@webapp/components/tooltip'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'
import { useI18n } from '@webapp/store/system'

import { State } from '../store'

const ButtonFilter = (props) => {
  const { disabled, query, onChangeQuery, state, Actions } = props

  const i18n = useI18n()

  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  return (
    <>
      <Tooltip messages={filter && [Expression.toString(filter, Expression.modes.sql)]}>
        <ButtonIconFilter
          title={filter ? null : 'dataView.filterRecords.buttonTitle'}
          className={`btn btn-s btn-edit${filter ? ' highlight' : ''}`}
          onClick={Actions.togglePanelFilter}
          disabled={disabled}
        />
      </Tooltip>

      {State.showPanelFilter(state) && (
        <ExpressionEditorPopup
          nodeDefUuidContext={entityDefUuid}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          types={[ExpressionEditorType.basic]}
          header={i18n.t('dataView.filterRecords.expressionEditorHeader')}
          onChange={({ expr }) => {
            onChangeQuery(Query.assocFilter(expr))
            Actions.closePanels()
          }}
          onClose={Actions.closePanels}
        />
      )}
    </>
  )
}

ButtonFilter.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonFilter
