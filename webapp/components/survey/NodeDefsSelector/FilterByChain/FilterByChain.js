import './FilterByChain.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const FilterByChain = ({ filterChainUuids, setFilterChainUuids }) => {
  const surveyId = useSurveyId()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const surveyCycleKey = useSurveyCycleKey()

  const [chains, setChains] = useState([])

  useEffect(() => {
    const fetchChains = async () => {
      const { chains } = await API.fetchChains({ surveyId, params: { surveyCycleKey } })
      setChains(chains)
    }

    fetchChains()
  }, [surveyId, surveyCycleKey])

  return (
    <div className="node-defs-selector__chains">
      <p>{i18n.t('common.chain')}</p>
      <div className="node-defs-selector__chains_filter">
        {chains.map((chain) => (
          <button
            type="button"
            key={Chain.getUuid(chain)}
            className={classNames('btn', 'btn-s', 'btn-node-def-type', 'deselectable', {
              active: filterChainUuids.includes(Chain.getUuid(chain)),
            })}
            onClick={() => {
              const filterChainUuidsUpdated = filterChainUuids.includes(Chain.getUuid(chain))
                ? filterChainUuids.filter((_uuid) => _uuid !== Chain.getUuid(chain))
                : [...filterChainUuids, Chain.getUuid(chain)]
              setFilterChainUuids(filterChainUuidsUpdated)
            }}
          >
            <span>{Chain.getLabel(lang)(chain)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

FilterByChain.propTypes = {
  filterChainUuids: PropTypes.array,
  setFilterChainUuids: PropTypes.func,
}

FilterByChain.defaultProps = {
  filterChainUuids: [],
  setFilterChainUuids: () => {},
}

export default FilterByChain
