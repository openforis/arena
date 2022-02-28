import './AnalysisNodeDefs.scss'
import React, { useRef, useMemo, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'
import { useChainEntityDefUuid, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import ErrorBadge from '@webapp/components/errorBadge'

import { AnalysisNodeDefsHeader } from './AnalysisNodeDefsHeader'
import { AnalysisNodeDef } from './AnalysisNodeDef'
import { useSortAnalysisNodeDefs } from './hooks'
import { useOnUpdate } from '@webapp/components/hooks'

const AnalysisNodeDefs = () => {
  const [showSamplingNodeDefs, setShowSamplingNodeDefs] = useState(false)
  const i18n = useI18n()
  const entityDefUuid = useChainEntityDefUuid()

  const chain = useChain()
  const validation = Chain.getValidation(chain)
  const survey = useSurvey()

  const analysisNodeDefsRef = useRef(null)

  const _analysisNodeDefsToShow = useMemo(
    () => Survey.getAnalysisNodeDefs({ chain, showSamplingNodeDefs, showInactiveResultVariables: true })(survey),
    [chain, survey, entityDefUuid, showSamplingNodeDefs]
  )

  useSortAnalysisNodeDefs({ analysisNodeDefsRef, analysisNodeDefs: _analysisNodeDefsToShow })

  // hide sampling node defs if chain doen't use sampling design
  useOnUpdate(() => {
    if (!Chain.isSamplingDesign(chain)) {
      setShowSamplingNodeDefs(false)
    }
  }, [Chain.isSamplingDesign(chain)])

  return (
    <div className="analysis-node-defs" ref={analysisNodeDefsRef}>
      {!entityDefUuid && Survey.getAnalysisNodeDefs({ chain, showInactiveResultVariables: true })(survey).length === 0 && (
        <div className="analysis-node-defs-error">
          <ErrorBadge validation={validation} showLabel={false} showIcon />
          <p>{i18n.t('chain.emptyNodeDefs')}</p>
        </div>
      )}

      <>
        <AnalysisNodeDefsHeader
          toggleShowSamplingNodeDefs={() => setShowSamplingNodeDefs(!showSamplingNodeDefs)}
          showSamplingNodeDefs={showSamplingNodeDefs}
        />

        {_analysisNodeDefsToShow.length > 0 && (
          <div className="analysis-node-defs__list">
            <div className="analysis-node-defs__list-header">
              <div />
              <div>{i18n.t('common.entity')}</div>
              <div>{i18n.t('common.name')}</div>
              <div>{i18n.t('common.label')}</div>
              <div>{i18n.t('common.areaBased')}</div>
              <div>{i18n.t('common.type')}</div>
              <div>{i18n.t('common.active')}</div>
              <div />
            </div>

            <div className="analysis-node-defs__list-content">
              {_analysisNodeDefsToShow.map((analysisNodeDef) => (
                <AnalysisNodeDef
                  key={NodeDef.getUuid(analysisNodeDef)}
                  nodeDefUuid={NodeDef.getUuid(analysisNodeDef)}
                />
              ))}
            </div>
          </div>
        )}
      </>
    </div>
  )
}

export { AnalysisNodeDefs }
