import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const TablePaginator = ({ offset, limit, count, fetchFn }) => {
  const currentPage = offset / limit + 1
  const totalPage = Math.ceil(count / limit)

  const i18n = useI18n()

  return (
    <div className="table__paginator">
      <button
        className="btn btn-transparent"
        aria-disabled={count < limit || currentPage === 1}
        onClick={() => fetchFn(0)}
      >
        <span className="icon icon-backward2 icon-14px" />
      </button>
      <button
        className="btn btn-transparent"
        aria-disabled={currentPage === 1}
        onClick={() => fetchFn(offset - limit)}
        style={{ transform: 'scaleX(-1)' }}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>

      <span className="counts">
        {offset + 1}-{Math.min(offset + limit, count)} {i18n.t('common.of')}{' '}
        {count}
      </span>

      <button
        className="btn btn-transparent"
        aria-disabled={currentPage === totalPage}
        onClick={() => fetchFn(offset + limit)}
      >
        <span className="icon icon-play3 icon-14px" />
      </button>
      <button
        className="btn btn-transparent"
        aria-disabled={currentPage === totalPage}
        onClick={() => fetchFn((totalPage - 1) * limit)}
      >
        <span className="icon icon-forward3 icon-14px" />
      </button>
    </div>
  )
}

export default TablePaginator
