import { useState } from 'react'
import * as Storage from './storage'

export const useDataExplorer = () => {
  const [query, setQuery] = useState(Storage.getQuery)

  return {
    query,
    setQuery,
    setQueryStorage: Storage.setQuery,
  }
}
