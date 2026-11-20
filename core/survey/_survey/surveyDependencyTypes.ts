export const dependencyTypes = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  editable: 'editable',
  fileName: 'fileName',
  formula: 'formula',
  itemsFilter: 'itemsFilter',
  maxCount: 'maxCount',
  minCount: 'minCount',
  parentCode: 'parentCode',
  required: 'required',
  validations: 'validations',
  visible: 'visible',
} as const

export type DependencyType = (typeof dependencyTypes)[keyof typeof dependencyTypes]

export const selfReferenceAllowedByDependencyType: Record<DependencyType, boolean> = {
  [dependencyTypes.applicable]: false,
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.editable]: false,
  [dependencyTypes.fileName]: false,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: false,
  [dependencyTypes.maxCount]: false,
  [dependencyTypes.minCount]: false,
  [dependencyTypes.parentCode]: false,
  [dependencyTypes.required]: false,
  [dependencyTypes.validations]: true,
  [dependencyTypes.visible]: false,
}
