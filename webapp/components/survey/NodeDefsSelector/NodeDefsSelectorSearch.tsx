import React from 'react'

import { Input } from '@webapp/components/form/Input'

type Props = {
  search: string
  setSearch: (search: string) => void
}

const NodeDefsSelectorSearch: React.FC<Props> = (props) => {
  const { search, setSearch } = props

  return (
    <Input
      allowClear
      className="node-defs-selector__input-search"
      placeholder="dataView:nodeDefsSelector.searchPlaceholder"
      value={search}
      onChange={setSearch}
    />
  )
}

export default NodeDefsSelectorSearch
