import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as DataSort from '@common/surveyRdb/dataSort'
import { Query } from '@common/model/query'

import { useI18n } from '@webapp/store/system'

import Tooltip from '@webapp/components/tooltip'

const SortEditor = () => <div /> // TODO: restore SortEditor

const ButtonSort = (props) => {
  const { disabled, query } = props
  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const sort = Query.getSort(query)

  const i18n = useI18n()

  const [showSortEditor, setShowSortEditor] = useState(false)
  const toggleSortEditor = () => setShowSortEditor(!showSortEditor)

  const sortMsg = DataSort.getViewExpr(
    i18n.t('dataView.dataVis.dataSort.ascending'),
    i18n.t('dataView.dataVis.dataSort.descending')
  )(sort)

  return (
    <>
      <Tooltip messages={sortMsg && [sortMsg]}>
        <button
          type="button"
          className={`btn btn-s btn-edit${sort.length > 0 ? ' highlight' : ''}`}
          onClick={toggleSortEditor}
          aria-disabled={disabled}
        >
          <span className="icon icon-sort-amount-asc icon-14px" />
        </button>
      </Tooltip>

      {showSortEditor && (
        <SortEditor
          nodeDefUuidCols={attributeDefUuids}
          nodeDefUuidContext={entityDefUuid}
          sort={sort}
          onChange={() => {
            // TODO dispatch(updateTableSort(sortUpdate))
          }}
          onClose={toggleSortEditor}
        />
      )}
    </>
  )
}

ButtonSort.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
}

export default ButtonSort
