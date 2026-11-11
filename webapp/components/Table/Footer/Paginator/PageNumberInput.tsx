import React, { useCallback, useState } from 'react'

import { useI18nT } from '@webapp/store/system'
import { TextInput } from '@webapp/components/form'

const removeNonDigits = (value: string): string => value.replaceAll(/\D/g, '')

type Props = {
  disabled?: boolean
  onPageChange: (pageNo: number) => void
  pageNo: number
  totalPages: number
}

export const PageNumberInput = (props: Props) => {
  const { disabled = false, onPageChange, pageNo, totalPages } = props

  const t = useI18nT()
  // null when not editing: the current page number is shown
  const [draftValue, setDraftValue] = useState<string | null>(null)

  const commit = useCallback(() => {
    if (draftValue === null) return
    const pageNoNext = Number(draftValue)
    if (draftValue && pageNoNext !== pageNo && pageNoNext >= 1 && pageNoNext <= totalPages) {
      onPageChange(pageNoNext)
    }
    setDraftValue(null)
  }, [draftValue, onPageChange, pageNo, totalPages])

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      commit()
    },
    [commit]
  )

  return (
    <form className="table__paginator-page" onSubmit={onSubmit}>
      <span className="label">{t('common.paginator.page')}</span>
      <TextInput
        className="table__paginator-page-input"
        disabled={disabled || totalPages <= 1}
        onBlur={commit}
        onChange={setDraftValue}
        textTransformFunction={removeNonDigits}
        title={t('common.paginator.goToPage')}
        value={draftValue ?? String(pageNo)}
      />
      <span className="label">
        {t('common.of')} {totalPages}
      </span>
    </form>
  )
}
