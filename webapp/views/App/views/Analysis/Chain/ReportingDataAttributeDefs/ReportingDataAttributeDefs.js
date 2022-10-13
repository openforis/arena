import React, { useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { Dropdown } from '@webapp/components/form'

export const ReportingDataAttributeDefs = (props) => {
  const { chain, updateChain } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const [reportingDataCategory, setReportingDataCategory] = useState(null)

  const availableReportingDataNodeDefs = Survey.getAvailableReportingDataNodeDefs({ chain })(survey)

  const samplingDesign = Chain.getSamplingDesign(chain)

  return (
    <>
      <FormItem label={i18n.t('chainView.reportingDataCategory')}>
        <CategorySelector
          categoryUuid={ChainSamplingDesign.getReportingDataCategoryUuid(samplingDesign)}
          emptySelection
          filterFunction={Category.isReportingData}
          onChange={(category) => {
            const categoryUuid = Category.getUuid(category)
            updateChain(
              Chain.updateSamplingDesign(ChainSamplingDesign.assocReportingDataCategoryUuid(categoryUuid))(chain)
            )
            if (!categoryUuid) setReportingDataCategory(null)
          }}
          onCategoryLoad={setReportingDataCategory}
        />
      </FormItem>
      {Category.getLevelsArray(reportingDataCategory).map((level) => {
        const categoryLevelUuid = CategoryLevel.getUuid(level)
        return (
          <FormItem
            key={categoryLevelUuid}
            label={i18n.t('chainView.reportingDataAttribute', { level: CategoryLevel.getName(level) })}
          >
            <Dropdown
              className="reporting-data-node-def-dropdown"
              items={availableReportingDataNodeDefs}
              selection={Survey.getNodeDefByUuid(
                ChainSamplingDesign.getReportingDataAttributeDefUuid({ categoryLevelUuid })(samplingDesign)
              )(survey)}
              itemKey="uuid"
              itemLabel={(nodeDef) => NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name)}
              onChange={(def) =>
                updateChain(
                  Chain.updateSamplingDesign(
                    ChainSamplingDesign.assocReportingDataAttributeDefUuid({
                      categoryLevelUuid,
                      nodeDefUuid: NodeDef.getUuid(def),
                    })
                  )(chain)
                )
              }
            />
          </FormItem>
        )
      })}
    </>
  )
}
