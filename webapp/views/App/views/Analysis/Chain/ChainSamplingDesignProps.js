import React from 'react'

import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'

import BaseUnitSelector from './BaseUnitSelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()

  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)

  return (
    <>
      {(Chain.isSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

      {hasBaseUnit && (
        <>
          <StratumAttributeSelector />

          <FormItem label={i18n.t('chainView.areaWeightingMethod')}>
            <Checkbox
              checked={Chain.isAreaWeightingMethod(chain)}
              validation={Validation.getFieldValidation(Chain.keysProps.areaWeightingMethod)(validation)}
              onChange={(areaWeightingMethod) =>
                updateChain(Chain.assocAreaWeightingMethod(areaWeightingMethod)(chain))
              }
            />
          </FormItem>

          <ClusteringEntitySelector />

          {Chain.getClusteringNodeDefUuid(chain) && (
            <FormItem label={i18n.t('chainView.clusteringOnlyVariances')}>
              <Checkbox
                checked={Chain.isClusteringOnlyVariances(chain)}
                validation={Validation.getFieldValidation(Chain.keysProps.clusteringOnlyVariances)(validation)}
                onChange={(clusteringOnlyVariances) =>
                  updateChain(Chain.assocClusteringOnlyVariances(clusteringOnlyVariances)(chain))
                }
              />
            </FormItem>
          )}
        </>
      )}
    </>
  )
}
