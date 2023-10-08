import React from 'react'
import { useNavigate } from 'react-router'

import { Objects } from '@openforis/arena-core'

import { updateQuery } from '@webapp/components/Table/tableLink'

import Paginator from './Paginator'

export const Footer = (props) => {
  const { list, offset, limit, count } = props

  const navigate = useNavigate()

  return (
    <div className="table__footer">
      {!Objects.isEmpty(list) && (
        <Paginator
          offset={offset}
          limit={limit}
          count={count}
          setLimit={(limitUpdated) => updateQuery(navigate)({ limit: limitUpdated })}
          setOffset={(offsetUpdated) => updateQuery(navigate)({ offset: offsetUpdated })}
        />
      )}
    </div>
  )
}
