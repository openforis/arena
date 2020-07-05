import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const Paginator = (props) => {
  const { count, limit, offset, setOffset } = props
  const pageNo = offset / limit + 1
  const totalNoPages = Math.ceil(count / limit)
  const isFirstPage = pageNo === 1
  const isLastPage = pageNo === totalNoPages

  const i18n = useI18n()

  return (
    <div className="table__paginator">
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={count < limit || isFirstPage}
        onClick={() => setOffset(0)}
      >
        <span className="icon icon-backward2 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={isFirstPage}
        onClick={() => setOffset(offset - limit)}
        style={{ transform: 'scaleX(-1)' }}
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
      >
        <span className="icon icon-play3 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={isLastPage}
        onClick={() => setOffset((totalNoPages - 1) * limit)}
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
  setOffset: PropTypes.func.isRequired,
}

export default Paginator
