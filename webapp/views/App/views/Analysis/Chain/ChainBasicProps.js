import React from 'react'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { useChain } from '@webapp/store/ui/chain'

import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

export const ChainBasicProps = (props) => {
  const { updateChain } = props

  const chain = useChain()
  const validation = Chain.getValidation(chain)

  return (
    <>
      <LabelsEditor
        labels={chain.props?.labels}
        formLabelKey="chainView.formLabel"
        readOnly={false}
        validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
        onChange={(labels) => updateChain({ ...chain, props: { ...chain.props, labels } })}
      />
      <LabelsEditor
        formLabelKey="common.description"
        labels={chain.props.descriptions}
        onChange={(descriptions) => updateChain({ ...chain, props: { ...chain.props, descriptions } })}
      />
      <CyclesSelector
        cyclesKeysSelected={chain.props.cycles}
        onChange={(cycles) => updateChain({ ...chain, props: { ...chain.props, cycles } })}
      />
    </>
  )
}
