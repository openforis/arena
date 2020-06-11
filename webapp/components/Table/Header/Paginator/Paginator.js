import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'
import { getLink } from '@webapp/components/Table/tableLink'

const Paginator = (props) => {
  const { offset, limit, count } = props
  const currentPage = offset / limit + 1
  const totalPage = Math.ceil(count / limit)

  const i18n = useI18n()

  return (
    <div className="table__paginator">
      <Link className="btn btn-transparent" aria-disabled={count < limit || currentPage === 1} to={getLink(0)}>
        <span className="icon icon-backward2 icon-14px" />
      </Link>
      <Link
        type="button"
        className="btn btn-transparent"
        aria-disabled={currentPage === 1}
        to={getLink(offset - limit)}
        style={{ transform: 'scaleX(-1)' }}
      >
        <span className="icon icon-play3 icon-14px" />
      </Link>

      <span className="counts">
        {offset + 1}-{Math.min(offset + limit, count)} {i18n.t('common.of')} {count}
      </span>

      <Link className="btn btn-transparent" aria-disabled={currentPage === totalPage} to={getLink(offset + limit)}>
        <span className="icon icon-play3 icon-14px" />
      </Link>
      <Link
        className="btn btn-transparent"
        aria-disabled={currentPage === totalPage}
        to={getLink((totalPage - 1) * limit)}
      >
        <span className="icon icon-forward3 icon-14px" />
      </Link>
    </div>
  )
}

Paginator.propTypes = {
  offset: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
}

export default Paginator
