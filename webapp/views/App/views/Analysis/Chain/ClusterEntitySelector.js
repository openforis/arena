import React from 'react'

import * as Survey from '@core/survey/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useI18n } from '@webapp/store/system'
import { useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

export const ClusterEntitySelector = () => {
  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const selectedEntityUuid = null

  return (
    <FormItem label={i18n.t('chainView.clusterEntity')}>
      <EntitySelector
        hierarchy={Survey.getHierarchy()(survey)}
        lang={lang}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={false}
        useNameAsLabel={true}
        allowEmptySelection={true}
      />
    </FormItem>
  )
}
