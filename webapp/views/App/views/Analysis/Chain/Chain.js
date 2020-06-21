import './Chain.scss'

import React from 'react'

import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/processingChain'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'

import { useI18n } from '@webapp/store/system'

import { useChain } from './store'

const ChainComponent = () => {
  const i18n = useI18n()
  const { chain, dirty, onUpdate, onSave, onDismiss } = useChain()
  const validation = Chain.getValidation(chain)

  return (
    <div className="chain">
      <div className="form">
        <LabelsEditor
          labels={Chain.getLabels(chain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={false}
          validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
          onChange={(labels) => onUpdate({ name: Chain.keysProps.labels, value: labels })}
        />

        <LabelsEditor
          formLabelKey="common.description"
          labels={Chain.getDescriptions(chain)}
          onChange={(descriptions) => onUpdate({ name: Chain.keysProps.descriptions, value: descriptions })}
        />

        <CyclesSelector
          cyclesKeysSelected={Chain.getCycles(chain)}
          onChange={(cycles) => onUpdate({ name: Chain.keysProps.cycles, value: cycles })}
        />
      </div>

      <div className="button-bar">
        <button type="button" className="btn-s btn-cancel" onClick={onDismiss}>
          <span className="icon icon-cross icon-left icon-10px" />
          {i18n.t(dirty ? 'common.cancel' : 'common.back')}
        </button>

        <button type="button" className="btn-s btn-primary" onClick={onSave} aria-disabled={false}>
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button>
      </div>
    </div>
  )
}

export default ChainComponent
