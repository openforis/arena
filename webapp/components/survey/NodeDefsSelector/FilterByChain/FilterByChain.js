import './FilterByChain.scss'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'

import { Button } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang, useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'

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

FilterByChain.defaultProps = {
  filterChainUuids: [],
  setFilterChainUuids: () => {},
}

export default FilterByChain
