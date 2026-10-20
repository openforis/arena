import './Paginator.scss'

import React, { useCallback } from 'react'

import { useI18nT } from '@webapp/store/system'
import { Button } from '@webapp/components/buttons'

import { ItemsPerPageSelector } from './ItemsPerPageSelector'
import { PageNumberInput } from './PageNumberInput'

type Props = {
  count: number
  disabled?: boolean
  limit: number
  offset: number
  setLimit: (limit: number) => void
  setOffset: (offset: number) => void
}

const Paginator = (props: Props) => {
  const { count, disabled = false, limit, offset, setLimit, setOffset } = props

  const t = useI18nT()

  const totalPages = Math.max(1, Math.ceil(count / limit))
  // offset may not be a multiple of limit (e.g. after changing the items per page)
  const pageNo = Math.min(Math.floor(offset / limit) + 1, totalPages)
  const isFirstPage = pageNo <= 1
  const isLastPage = pageNo >= totalPages
  const firstItemNo = count === 0 ? 0 : offset + 1
  const lastItemNo = Math.min(offset + limit, count)

  const goToPage = useCallback((pageNoNext: number) => setOffset((pageNoNext - 1) * limit), [limit, setOffset])

  return (
    <div className="table__paginator">
      <ItemsPerPageSelector disabled={disabled} limit={limit} setLimit={setLimit} />

      <Button
        disabled={disabled || isFirstPage}
        iconClassName="icon-backward2 icon-14px"
        onClick={() => goToPage(1)}
        title="common.paginator.firstPage"
        variant="text"
      />
      <Button
        disabled={disabled || isFirstPage}
        iconClassName="icon-play3 icon-14px"
        onClick={() => goToPage(pageNo - 1)}
        style={{ transform: 'scaleX(-1)' }}
        title="common.paginator.previousPage"
        variant="text"
      />

      <PageNumberInput disabled={disabled} onPageChange={goToPage} pageNo={pageNo} totalPages={totalPages} />

      <Button
        disabled={disabled || isLastPage}
        iconClassName="icon-play3 icon-14px"
        onClick={() => goToPage(pageNo + 1)}
        title="common.paginator.nextPage"
        variant="text"
      />
      <Button
        disabled={disabled || isLastPage}
        iconClassName="icon-forward3 icon-14px"
        onClick={() => goToPage(totalPages)}
        title="common.paginator.lastPage"
        variant="text"
      />

      <span className="counts">
        {firstItemNo}-{lastItemNo} {t('common.of')} {count}
      </span>
    </div>
  )
}

export default Paginator
