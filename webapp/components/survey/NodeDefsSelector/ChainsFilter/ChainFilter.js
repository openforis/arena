import './ChainFilter.scss'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang, useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

import * as API from '@webapp/service/api'

const ChainsFilter = ({ filterChains, setFilterChains }) => {
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
        {(chains || []).map((chain) => (
          <button
            type="button"
            key={Chain.getUuid(chain)}
            className={classNames('btn', 'btn-s', 'btn-node-def-type', 'deselectable', {
              active: filterChains.includes(Chain.getUuid(chain)),
            })}
            onClick={() => {
              const filterChainsUpdated = filterChains.includes(Chain.getUuid(chain))
                ? filterChains.filter((_uuid) => _uuid !== Chain.getUuid(chain))
                : [...filterChains, Chain.getUuid(chain)]
              setFilterChains(filterChainsUpdated)
            }}
          >
            <span>{Chain.getLabel(lang)(chain)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

ChainsFilter.propTypes = {
  filterChains: PropTypes.array,
  setFilterChains: PropTypes.func,
}

ChainsFilter.defaultProps = {
  filterChains: [],
  setFilterChains: () => {},
}

export default ChainsFilter
