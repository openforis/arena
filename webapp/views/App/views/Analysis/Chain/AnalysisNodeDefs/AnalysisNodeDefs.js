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

const AnalysisNodeDefs = () => {
  const [showBaseUnit, setShowBaseUnit] = useState(false)
  const i18n = useI18n()
  const entityDefUuid = useChainEntityDefUuid()

  const chain = useChain()
  const validation = Chain.getValidation(chain)
  const survey = useSurvey()

  const analysisNodeDefsRef = useRef(null)

  const _analysisNodeDefsToShow = useMemo(
    () => Survey.getAnalysisNodeDefs({ chain, showBaseUnit })(survey),
    [chain, survey, entityDefUuid, showBaseUnit]
  )

  useSortAnalysisNodeDefs({ analysisNodeDefsRef, analysisNodeDefs: _analysisNodeDefsToShow })

  return (
    <div className="analysis-node-defs-wrapper">
      <div className="analysis-node-defs" ref={analysisNodeDefsRef}>
        {!entityDefUuid && Survey.getAnalysisNodeDefs({ chain })(survey).length <= 0 && (
          <div className="analysis-node-defs-error">
            <ErrorBadge validation={validation} showLabel={false} showIcon />
            <p>{i18n.t('chain.emptyNodeDefs')}</p>
          </div>
        )}

        <>
          <AnalysisNodeDefsHeader
            toggleShowBaseUnit={() => setShowBaseUnit(!showBaseUnit)}
            showBaseUnit={showBaseUnit}
          />

          {_analysisNodeDefsToShow.length > 0 && (
            <div className="analysis-node-def__list-header">
              <div />
              <div>{i18n.t('common.entity')}</div>
              <div>{i18n.t('common.name')}</div>
              <div>{i18n.t('common.label')}</div>
              <div>{i18n.t('common.type')}</div>
              <div>{i18n.t('common.active')}</div>
              <div />
            </div>
          )}

          {_analysisNodeDefsToShow.map((analysisNodeDef) => (
            <AnalysisNodeDef key={NodeDef.getUuid(analysisNodeDef)} nodeDefUuid={NodeDef.getUuid(analysisNodeDef)} />
          ))}
        </>
      </div>
    </div>
  )
}

export { AnalysisNodeDefs }
