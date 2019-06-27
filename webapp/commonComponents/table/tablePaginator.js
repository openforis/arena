import React from 'react'

const TablePaginator = ({offset, limit, count, fetchFn}) => {
  const currentPage = (offset / limit) + 1
  const totalPage = Math.ceil(count / limit)

  return (
    <div className="table__paginator">

      <button className="btn"
              aria-disabled={count < limit || currentPage === 1}
              onClick={() => fetchFn(0)}>
        <span className="icon icon-backward2 icon-14px"/>
      </button>
      <button className="btn"
              aria-disabled={currentPage === 1}
              onClick={() => fetchFn(offset - limit)}
              style={{transform: 'scaleX(-1)'}}>
        <span className="icon icon-play3 icon-14px"/>
      </button>

      <span className="counts">
      {offset + 1}-{Math.min(offset + limit, count)} of {count}
      </span>

      <button className="btn"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchFn(offset + limit)}>
        <span className="icon icon-play3 icon-14px"/>
      </button>
      <button className="btn"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchFn((totalPage - 1) * limit)}>
        <span className="icon icon-forward3 icon-14px"/>
      </button>

    </div>
  )
}

export default TablePaginator