import './Paginator.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'
import Dropdown from '@webapp/components/form/Dropdown'
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
      <Button
        disabled={count < limit || isFirstPage}
        iconClassName="icon-backward2 icon-14px"
        onClick={() => setOffset(0)}
        title="common.paginator.firstPage"
        variant="text"
      />

      <Button
        disabled={isFirstPage}
        iconClassName="icon-play3 icon-14px"
        onClick={() => setOffset(offset - limit)}
        style={{ transform: 'scaleX(-1)' }}
        title="common.paginator.previousPage"
        variant="text"
      />

      <span className="counts">
        {offset + 1}-{Math.min(offset + limit, count)} {i18n.t('common.of')} {count}
      </span>

      <Button
        disabled={isLastPage}
        iconClassName="icon-play3 icon-14px"
        onClick={() => setOffset(offset + limit)}
        title="common.paginator.nextPage"
        variant="text"
      />

      <Button
        disabled={isLastPage}
        iconClassName="icon-forward3 icon-14px"
        onClick={() => setOffset((totalNoPages - 1) * limit)}
        title="common.paginator.lastPage"
        variant="text"
      />
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
