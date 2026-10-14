import React from 'react'

import { SurveyCompareCategoryDiff, SurveyCompareResult } from '@core/survey/surveyCompare/surveyCompareTypes'

import { SurveyCompareListWithChildren } from './SurveyCompareListWithChildren'

const config = {
  getChildren: (diff: SurveyCompareCategoryDiff) =>
    diff.items.map((item) => ({ key: item.codePath.join('/'), label: item.codePath.join(' / '), item })),
  getCounts: (diff: SurveyCompareCategoryDiff) => diff.itemsCount,
  countsLabelKey: 'surveyCompareView:itemsCount',
  childLabelKey: 'surveyCompareView:itemCode',
  removalLabelKey: 'surveyCompareView:categoryRemoval',
}

export const SurveyCompareCategories = ({
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
}) => <SurveyCompareListWithChildren diffs={result.categories} config={config} {...otherProps} />
