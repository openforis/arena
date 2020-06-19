import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as DataSort from '@common/surveyRdb/dataSort'

import { useI18n } from '@webapp/store/system'

import Tooltip from '@webapp/components/tooltip'
import SortEditor from '@webapp/views/App/views/Data/Explorer/dataQuery/components/sort/sortEditor'

import { updateTableSort } from '@webapp/views/App/views/Data/Explorer/dataQuery/actions'

const ButtonSort = (props) => {
  const { nodeDefUuidContext, nodeDefUuidCols, sort, disabled } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [showSortEditor, setShowSortEditor] = useState(false)
  const toggleSortEditor = () => {
    setShowSortEditor(!showSortEditor)
  }

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
          nodeDefUuidCols={nodeDefUuidCols}
          nodeDefUuidContext={nodeDefUuidContext}
          sort={sort}
          onChange={(sortUpdate) => {
            dispatch(updateTableSort(sortUpdate))
          }}
          onClose={toggleSortEditor}
        />
      )}
    </>
  )
}

ButtonSort.propTypes = {
  nodeDefUuidContext: PropTypes.string.isRequired,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  sort: PropTypes.arrayOf(Object).isRequired,
  disabled: PropTypes.bool.isRequired,
}

export default ButtonSort
