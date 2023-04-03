import React, { useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Chain from '@common/analysis/chain'

import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { Dropdown } from '@webapp/components/form'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

export const ReportingDataAttributeDefs = (props) => {
  const { chain, updateStatisticalAnalysis } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const [reportingDataCategory, setReportingDataCategory] = useState(null)

  const availableReportingDataNodeDefs = Survey.getAvailableReportingDataNodeDefs({ chain })(survey)

  const statisticalAnalysis = Chain.getStatisticalAnalysis(chain)

  return (
    <fieldset className="reporting-data-table-and-joins">
      <legend>{i18n.t('chainView.reportingDataTableAndJoinsWithAttributes')}</legend>
      <FormItem label={i18n.t('chainView.reportingDataCategory')}>
        <CategorySelector
          categoryUuid={ChainStatisticalAnalysis.getReportingDataCategoryUuid(statisticalAnalysis)}
          emptySelection
          filterFunction={Category.isReportingData}
          onChange={(category) => {
            const categoryUuid = Category.getUuid(category)
            updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingDataCategoryUuid(categoryUuid))
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
              items={availableReportingDataNodeDefs}
              selection={Survey.getNodeDefByUuid(
                ChainStatisticalAnalysis.getReportingDataAttributeDefUuid({ categoryLevelUuid })(statisticalAnalysis)
              )(survey)}
              itemValue="uuid"
              itemLabel={(nodeDef) => NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name)}
              onChange={(def) =>
                updateStatisticalAnalysis(
                  ChainStatisticalAnalysis.assocReportingDataAttributeDefUuid({
                    categoryLevelUuid,
                    nodeDefUuid: NodeDef.getUuid(def),
                  })
                )
              }
            />
          </FormItem>
        )
      })}
    </fieldset>
  )
}
