const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
  setProp,
  getProp,
  toIndexedObj,
} = require('./surveyUtils')

const {
  getValidation,
  getFieldValidation,
  updateValidationStatus,
  dissocFieldValidation,
  updateFieldValidation,
} = require('../validation/validator')

const levels = 'levels'
const itemsValidationPath = ['validation', 'fields', 'items']

/**
 * CODE LIST
 */
// ====== CREATE
const newCodeList = () => ({
  uuid: uuidv4(),
  levels: {0: newCodeListLevel()},
  props: {},
})

// ====== READ
const getCodeListLevels = R.prop(levels)
const getCodeListLevelsArray = R.pipe(
  getCodeListLevels,
  R.values,
  R.sortBy(R.prop('index'))
)

const getCodeListLevelsLength = R.pipe(
  getCodeListLevels,
  R.keys,
  R.length
)

const getCodeListLevelById = id => R.pipe(
  getCodeListLevelsArray,
  R.find(R.propEq('id', id)),
)
const getCodeListLevelByIndex = idx => R.path(['levels', idx])

// ====== UPDATE
const assocCodeListLevelsArray = array => R.assoc(levels, toIndexedObj(array, 'index'))
const assocCodeListLevel = level => R.assocPath([levels, level.index], level)

// ====== DELETE
const dissocCodeListLevel = levelIndex => R.dissocPath([levels, R.toString(levelIndex)])

/**
 * CODE LIST LEVEL
 */
// ====== CREATE
const newCodeListLevel = (codeList) => {
  const index = codeList ? getCodeListLevelsArray(codeList).length : 0

  return {
    uuid: uuidv4(),
    codeListId: R.propOr(null, 'id')(codeList),
    index,
    props: {
      name: 'level_' + (index + 1),
    }
  }
}
// ====== READ

// ====== UPDATE
const assocCodeListLevelProp = (levelIndex, key, value) => R.assocPath(['levels', levelIndex, 'props', key], value)

/**
 * CODE LIST ITEM
 */
// ====== CREATE
const newCodeListItem = (levelId, parentId = null) => {
  return {
    uuid: uuidv4(),
    levelId,
    parentId,
    props: {},
  }
}

// ====== READ
const getCodeListItemLabels = getProp('labels')

const getCodeListItemLabel = language => R.pipe(getCodeListItemLabels, R.prop(language))

const getCodeListItemValidationPath = (ancestorAndSelfUUIDs) => R.reduce(
  (currentPath, itemUUID) =>
    R.concat(currentPath, ['fields', 'items', 'fields', itemUUID])
  , ['validation']
)(ancestorAndSelfUUIDs)

const getCodeListItemChildItemsValidationPath = itemUUIDs => {
  if (R.isEmpty(itemUUIDs)) {
    return ['validation', 'fields', 'items']
  } else {
    const lastItemUUID = R.last(itemUUIDs)
    const firstItemUUIDs = R.take(itemUUIDs.length - 1, itemUUIDs)
    return R.concat(getCodeListItemChildItemsValidationPath(firstItemUUIDs), ['fields', lastItemUUID, 'fields', 'items'])
  }
}

const getValidationByPath = path => R.pathOr({valid: true}, path)

const getCodeListItemsValidation = R.pathOr({valid: true}, itemsValidationPath)

const getCodeListItemValidation = ancestorAndSelfUUIDs =>
  getCodeListItemValidationByPath(getCodeListItemValidationPath(ancestorAndSelfUUIDs))

const getCodeListItemValidationByPath = path =>
  R.pathOr({valid: true}, path)

// ======= UPDATE
const assocCodeListItemsValidation = validation => R.assocPath(itemsValidationPath, validation)

const dissocCodeListItemValidation = ancestorAndSelfUUIDs => codeList => {
  return R.pipe(
    R.dissocPath(getCodeListItemValidationPath(ancestorAndSelfUUIDs)),
    updateCodeListItemsValidationStatus(ancestorAndSelfUUIDs)
  )(codeList)
}

const assocCodeListItemChildItemsValidation = (ancestorAndSelfUUIDs, validation) =>
  codeList => {
    const validationPath = getCodeListItemChildItemsValidationPath(ancestorAndSelfUUIDs)

    return R.pipe(
      R.assocPath(validationPath, validation),
      updateCodeListItemsValidationStatus(ancestorAndSelfUUIDs)
    )(codeList)
  }

const updateCodeListItemsValidationStatus = ancestorUUIDs =>
  codeList => {
    if (R.isEmpty(ancestorUUIDs)) {
      //update code list items global validation status
      return R.pipe(
        getCodeListItemsValidation,
        updateValidationStatus,
        newItemsValidation => assocCodeListItemsValidation(newItemsValidation)(codeList),
      )(codeList)
    } else {
      const itemValidationPath = getCodeListItemValidationPath(ancestorUUIDs)
      return updateAncestorItemsValidationStatusByPath(itemValidationPath)(codeList)
    }
  }

const updateAncestorItemsValidationStatusByPath = path =>
  codeList => {
    const validation = updateValidationStatus(getValidationByPath(path)(codeList))
    const parentValidationPath = R.take(path.length - 2, path)
    const field = R.last(path)
    const parentValidation = getValidationByPath(parentValidationPath)(codeList)
    const updatedParentValidation = validation.valid
      ? dissocFieldValidation(field)(parentValidation)
      : updateFieldValidation(field, validation)(parentValidation)

    const updatedCodeList = R.assocPath(parentValidationPath, updatedParentValidation)(codeList)

    if (R.equals(parentValidationPath, itemsValidationPath)) {
      return updatedCodeList
    } else {
      return updateAncestorItemsValidationStatusByPath(parentValidationPath)(updatedCodeList)
    }
  }

// UTILS
const isCodeListLevelDeleteAllowed = level => R.pipe(
  getCodeListLevelsArray,
  R.length,
  levelsCount => R.and(
    level.index > 0,
    level.index === (levelsCount - 1)
  )
)

module.exports = {
  // ====== CODE LIST
  //CREATE
  newCodeList,

  //READ
  getCodeListName: getProp('name'),
  getCodeListLevelsArray,
  getCodeListLevelById,
  getCodeListLevelByIndex,

  // UPDATE
  assocCodeListProp: setProp,
  assocCodeListLevelsArray,
  assocCodeListLevel,

  // DELETE
  dissocCodeListLevel,

  // ====== CODELIST LEVEL
  //CREATE
  newCodeListLevel,
  //READ
  getCodeListLevelsLength,
  getCodeListLevelName: getProp('name'),
  getCodeListLevelValidation: levelIndex => R.pipe(
    getValidation,
    getFieldValidation('levels'),
    getFieldValidation(levelIndex),
  ),
  //UPDATE
  assocCodeListLevelProp,
  assocCodeListLevelsValidation: validation => R.assocPath(['validation', 'fields', 'levels'], validation),
  dissocCodeListLevelValidation: levelIndex => R.dissocPath(['validation', 'fields', 'levels', 'fields', R.toString(levelIndex)]),
  // DELETE

  // ====== CODELIST ITEM
  //CREATE
  newCodeListItem,

  //READ
  getCodeListItemId: R.propOr(null, 'id'),
  getCodeListItemCode: getProp('code'),
  getCodeListItemLabels,
  getCodeListItemLabel,
  getCodeListItemValidation,

  //UPDATE
  assocCodeListItemProp: setProp,
  dissocCodeListItemValidation,
  assocCodeListItemChildItemsValidation,

  //UTILS
  isCodeListLevelDeleteAllowed,
}