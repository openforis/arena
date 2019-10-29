import './processingChainSteps.scss'

import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import LeaderLine from 'leader-line'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'

import {
  createProcessingStep,
  fetchProcessingSteps
} from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainSteps = props => {
  const {
    history, processingChain,
    createProcessingStep, fetchProcessingSteps
  } = props
  const i18n = useI18n()

  const processingSteps = ProcessingChain.getProcessingSteps(processingChain)
  const leaderLines = useRef([])

  useEffect(() => {
    fetchProcessingSteps(ProcessingChain.getUuid(processingChain))

    return () => {
      leaderLines.current.forEach(leaderLine => {
        leaderLine.remove()
      })
    }
  }, [])

  useOnUpdate(() => {
    for (let i = leaderLines.current.length; i < processingSteps.length; i++) {
      if (i !== processingSteps.length - 1) {
        const elStart = document.getElementsByClassName(`processing-chain__step_${i}`)[0]
        const elEnd = document.getElementsByClassName(`processing-chain__step_${i + 1}`)[0]
        const leaderLine = new LeaderLine(elStart, elEnd, {
          size: 2,
          color: '#3885CA',
          startPlug: 'square',
          endPlug: 'disc'
        })
        leaderLines.current.push(leaderLine)
      }
    }
  }, [processingSteps.length])

  return (
    <div className="form-item">
      <label className="form-label">{i18n.t('processingChainView.processingSteps')}</label>

      <div className="processing-chain__steps">
        {
          processingSteps.map(step => {
              const index = ProcessingStep.getIndex(step)
              return (
                <div key={index} className={`processing-chain__step processing-chain__step_${index}`}>
                  <span className="icon icon-pencil2 icon-10px icon-edit"/>
                  {
                    ProcessingStep.getEntityUuid(step)
                  }
                </div>
              )
            }
          )
        }

        <button className="btn processing-chain__step" onClick={() => createProcessingStep(history)}>
          <span className="icon icon-plus icon-14px"/>
        </button>
      </div>
    </div>
  )

}

ProcessingChainSteps.defaultProps = {
  processingChain: null,
}

export default connect(null, { createProcessingStep, fetchProcessingSteps })(ProcessingChainSteps)
