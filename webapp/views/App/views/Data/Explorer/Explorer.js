import React, { useState } from 'react'

import { Query } from '@common/model/query'

import DataQuery from '@webapp/components/DataQuery'

const Explorer = () => {
  const [query, setQuery] = useState(Query.create())

  return <DataQuery query={query} onChangeQuery={setQuery} />
}

export default Explorer
