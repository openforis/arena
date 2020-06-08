import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const TablePaginator = (props) => {
  const { offset, limit, count, fetchFn } = props
  const currentPage = offset / limit + 1
  const totalPage = Math.ceil(count / limit)

  const i18n = useI18n()

  return (
    <div className="table__paginator">
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={count < limit || currentPage === 1}
        onClick={() => fetchFn(0)}
      >
        <span className="icon icon-backward2 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={currentPage === 1}
        onClick={() => fetchFn(offset - limit)}
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
        aria-disabled={currentPage === totalPage}
        onClick={() => fetchFn(offset + limit)}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>
      <button
        type="button"
        className="btn btn-transparent"
        aria-disabled={currentPage === totalPage}
        onClick={() => fetchFn((totalPage - 1) * limit)}
      >
        <span className="icon icon-forward3 icon-14px" />
      </button>
    </div>
  )
}

TablePaginator.propTypes = {
  offset: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  fetchFn: PropTypes.func.isRequired,
}

export default TablePaginator
