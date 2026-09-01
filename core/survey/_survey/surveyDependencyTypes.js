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
  validations: 'validations',
  visible: 'visible',
}

export const isContextParentByDependencyType = {
  [dependencyTypes.applicable]: true,
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.editable]: true,
  [dependencyTypes.fileName]: true,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: true,
  [dependencyTypes.maxCount]: true,
  [dependencyTypes.minCount]: true,
  [dependencyTypes.parentCode]: false,
  [dependencyTypes.validations]: false,
  [dependencyTypes.visible]: true,
}

export const selfReferenceAllowedByDependencyType = {
  [dependencyTypes.applicable]: false,
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.editable]: false,
  [dependencyTypes.fileName]: false,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: false,
  [dependencyTypes.maxCount]: false,
  [dependencyTypes.minCount]: false,
  [dependencyTypes.parentCode]: false,
  [dependencyTypes.validations]: true,
  [dependencyTypes.visible]: false,
}
