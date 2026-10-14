import React from 'react'

import { SurveyCompareResult, SurveyCompareTaxonomyDiff } from '@core/survey/surveyCompare/surveyCompareTypes'

import { SurveyCompareListWithChildren } from './SurveyCompareListWithChildren'

const config = {
  getChildren: (diff: SurveyCompareTaxonomyDiff) =>
    diff.taxa.map((taxon) => ({ key: taxon.code, label: taxon.code, item: taxon })),
  getCounts: (diff: SurveyCompareTaxonomyDiff) => diff.taxaCount,
  countsLabelKey: 'surveyCompareView:taxaCount',
  childLabelKey: 'surveyCompareView:taxonCode',
  removalLabelKey: 'surveyCompareView:taxonomyRemoval',
}

export const SurveyCompareTaxonomies = ({
  result,
  ...otherProps
}: {
  result: SurveyCompareResult
  canEdit: boolean
  selectedIds: Set<string>
  onToggle: (id: string, selected: boolean) => void
  onlyDifferences: boolean
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) => <SurveyCompareListWithChildren diffs={result.taxonomies} config={config} {...otherProps} />
