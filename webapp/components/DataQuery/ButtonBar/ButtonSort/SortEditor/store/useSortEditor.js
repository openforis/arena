import { useState } from 'react'

export const useSortEditor = ({ sort }) => {
  const [draft] = useState(false)
  const [sortDraft] = useState(sort)

  return {
    draft,
    sortDraft,
  }
}
