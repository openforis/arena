import './AnalysisNodeDefs.scss'

import React, { useMemo, useRef, useState } from 'react'

import * as Chain from '@common/analysis/chain'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import ErrorBadge from '@webapp/components/errorBadge'
import { useOnUpdate } from '@webapp/components/hooks'
import { useSurvey } from '@webapp/store/survey'
import { useDataCountByEntityDefUuid } from '@webapp/store/surveyRdb/hooks'
import { useI18n } from '@webapp/store/system'
import { useChain } from '@webapp/store/ui/chain'

import { AnalysisNodeDef } from './AnalysisNodeDef'
import { AnalysisNodeDefsHeader } from './AnalysisNodeDefsHeader'
import { useSortAnalysisNodeDefs } from './hooks'

const AnalysisNodeDefs = () => {
  const [showSamplingNodeDefs, setShowSamplingNodeDefs] = useState(false)
  const i18n = useI18n()

  const chain = useChain()
  const validation = Chain.getValidation(chain)
  const survey = useSurvey()

  const analysisNodeDefsContainerRef = useRef(null)

  const analysisNodeDefsToShow = useMemo(
    () => Survey.getAnalysisNodeDefs({ chain, showSamplingNodeDefs, showInactiveResultVariables: true })(survey),
    [chain, survey, showSamplingNodeDefs]
  )

  useSortAnalysisNodeDefs({ analysisNodeDefsContainerRef, analysisNodeDefs: analysisNodeDefsToShow })

  const entityViewDataCountsByUuid = useDataCountByEntityDefUuid({ nodeDefs: analysisNodeDefsToShow })

  // hide sampling node defs if chain doen't use sampling design
  useOnUpdate(() => {
    if (!Chain.hasSamplingDesign(chain)) {
      setShowSamplingNodeDefs(false)
    }
  }, [Chain.hasSamplingDesign(chain)])

  return (
    <div className="analysis-node-defs">
      {analysisNodeDefsToShow.length === 0 && (
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

        {analysisNodeDefsToShow.length > 0 && (
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

            <div className="analysis-node-defs__list-content" ref={analysisNodeDefsContainerRef}>
              {analysisNodeDefsToShow.map((analysisNodeDef) => (
                <AnalysisNodeDef
                  key={NodeDef.getUuid(analysisNodeDef)}
                  nodeDefUuid={NodeDef.getUuid(analysisNodeDef)}
                  dataCount={entityViewDataCountsByUuid[NodeDef.getParentUuid(analysisNodeDef)]}
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
