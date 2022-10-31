import './Paginator.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/Dropdown'

const itemsPerPageValues = [15, 30, 50]
const itemsPerPageDefault = 15

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
          items={itemsPerPageValues}
          itemValue={A.identity}
          itemLabel={A.identity}
          selection={limit}
          onChange={(limitUpdated) => {
            if (itemsPerPageValues.includes(Number(limitUpdated))) {
              setLimit(limitUpdated)
            } else {
              setLimit(itemsPerPageDefault)
            }
          }}
        />
      </div>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={count < limit || isFirstPage}
        onClick={() => setOffset(0)}
        title={i18n.t('common.paginator.firstPage')}
      >
        <span className="icon icon-backward2 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={isFirstPage}
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
        aria-disabled={isLastPage}
        onClick={() => setOffset(offset + limit)}
        title={i18n.t('common.paginator.nextPage')}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={isLastPage}
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
