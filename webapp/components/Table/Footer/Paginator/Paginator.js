import './Paginator.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import Dropdown from '@webapp/components/form/Dropdown'
import { useI18n } from '@webapp/store/system'

import { TableConstants } from '../../constants'

const Paginator = (props) => {
  const { count, limit, offset, setLimit, setOffset } = props
  const pageNo = offset / limit + 1
  const totalNoPages = Math.ceil(count / limit)
  const isFirstPage = pageNo === 1
  const isLastPage = pageNo === totalNoPages

  const i18n = useI18n()

  return (
    <div className="table__paginator">
      <div className="table__paginator-items-per-page">
        <div className="label">{i18n.t('common.paginator.itemsPerPage')}:</div>
        <Dropdown
          clearable={false}
          items={TableConstants.itemsPerPageValues}
          itemValue={A.identity}
          itemLabel={A.identity}
          selection={limit}
          onChange={(limitUpdated) => {
            const limitNext = TableConstants.itemsPerPageValues.includes(Number(limitUpdated))
              ? limitUpdated
              : TableConstants.itemsPerPageDefault
            setLimit(limitNext)
          }}
        />
      </div>
      <button
        type="button"
        className="btn btn-transparent"
        disabled={count < limit || isFirstPage}
        onClick={() => setOffset(0)}
        title={i18n.t('common.paginator.firstPage')}
      >
        <span className="icon icon-backward2 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        disabled={isFirstPage}
        onClick={() => setOffset(offset - limit)}
        style={{ transform: 'scaleX(-1)' }}
        title={i18n.t('common.paginator.previousPage')}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>

      <span className="counts">
        {offset + 1}-{Math.min(offset + limit, count)} {i18n.t('common.of')} {count}
      </span>

      <button
        type="button"
        className="btn btn-transparent"
        disabled={isLastPage}
        onClick={() => setOffset(offset + limit)}
        title={i18n.t('common.paginator.nextPage')}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        disabled={isLastPage}
        onClick={() => setOffset((totalNoPages - 1) * limit)}
        title={i18n.t('common.paginator.lastPage')}
      >
        <span className="icon icon-forward3 icon-14px" />
      </button>
    </div>
  )
}

Paginator.propTypes = {
  count: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  setLimit: PropTypes.func.isRequired,
  setOffset: PropTypes.func.isRequired,
}

export default Paginator
