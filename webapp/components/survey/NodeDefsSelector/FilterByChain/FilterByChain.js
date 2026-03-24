import './FilterByChain.scss'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Chain from '@common/analysis/chain'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang, useSurveyCycleKey, useChains } from '@webapp/store/survey'

const FilterByChain = ({ filterChainUuids = [], setFilterChainUuids = () => {} }) => {
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const surveyCycleKey = useSurveyCycleKey()

  const chains = useChains({ surveyCycleKey })

  if (!chains || chains.length === 0) return null

  return (
    <div className="node-defs-selector__chains">
      <p>{i18n.t('common.chain')}</p>
      <div className="node-defs-selector__chains_filter">
        {chains.map((chain) => {
          const active = filterChainUuids.includes(Chain.getUuid(chain))
          return (
            <Button
              key={Chain.getUuid(chain)}
              active={active}
              className={classNames('btn', 'btn-s', 'btn-node-def-type', 'deselectable')}
              label={Chain.getLabel(lang)(chain)}
              onClick={() => {
                const filterChainUuidsUpdated = active
                  ? filterChainUuids.filter((_uuid) => _uuid !== Chain.getUuid(chain))
                  : [...filterChainUuids, Chain.getUuid(chain)]
                setFilterChainUuids(filterChainUuidsUpdated)
              }}
              variant="outlined"
            />
          )
        })}
      </div>
    </div>
  )
}

FilterByChain.propTypes = {
  filterChainUuids: PropTypes.array,
  setFilterChainUuids: PropTypes.func,
}

export default FilterByChain
