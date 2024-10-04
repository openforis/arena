import * as ProcessUtils from '@core/processUtils'
import * as Expression from '@core/expressionParser/expression'

const { functionNames, modes } = Expression

const functionExamples = {
  [modes.json]: {
    [functionNames.categoryItemProp]: `cateoryItemProp('category_name', 'prop_name', 'codeLevel1', 'codeLevel2', ...)`,
    [functionNames.distance]: 'distance(coordinate_attribute_1, coordinate_attribute_2)',
    [functionNames.first]: 'first(multiple_attribute_name), first(multiple_entity_name).entity_attribute_name, ...',
    [functionNames.geoPolygon]:
      'geoPolygon(coordinate_attribute_1, coordinate_attribute_2, ...), geoPolygon(multiple_entity_name.coordinate_attribute), ...',
    [functionNames.includes]: `includes(multiple_attribute_name, 'value') = true/false`,
    [functionNames.index]: `index(node_name), index(this), index($context), index(parent(this))`,
    [functionNames.isEmpty]: `isEmpty(attribute_name) = true/false`,
    [functionNames.last]: 'last(multiple_entity_name).entity_attribute_name, last(multiple_attribute_name), ...',
    [functionNames.ln]: 'ln(10) = 2.302…',
    [functionNames.log10]: 'log10(100) = 2',
    [functionNames.max]: 'max(3,1,2) = 3',
    [functionNames.min]: 'min(3,1) = 1',
    [functionNames.now]: 'now()',
    [functionNames.parent]: `parent(this), parent($context), parent(node_name)`,
    [functionNames.pow]: 'pow(2,3) = 2³ = 8',
    [functionNames.taxonProp]: `taxonProp('taxonomy_name', 'extra_prop', 'taxon_code')`,
    [functionNames.userEmail]: 'userEmail()',
    [functionNames.userName]: 'userName()',
    [functionNames.userProp]: `userProp('prop_name')`,
    [functionNames.uuid]: 'uuid()',
  },
  [modes.sql]: {
    [functionNames.avg]: 'avg(variable_name)',
    [functionNames.count]: 'count(variable_name)',
    [functionNames.sum]: 'sum(variable_name)',
  },
}

const experimentalFunctions = [
  functionNames.geoPolygon,
  functionNames.userEmail,
  functionNames.userName,
  functionNames.userProp,
]

const isFunctionAvailable = (functionName) =>
  ProcessUtils.ENV.experimentalFeatures || !experimentalFunctions.includes(functionName)

const availableFunctionExamples = Object.entries(functionExamples).reduce(
  (accFunctionsByMode, [mode, functionsInMode]) => {
    const availableFunctionInMode = Object.entries(functionsInMode).reduce(
      (accFunctionsByName, [functionName, value]) => {
        if (isFunctionAvailable(functionName)) {
          accFunctionsByName[functionName] = value
        }
        return accFunctionsByName
      },
      {}
    )
    accFunctionsByMode[mode] = availableFunctionInMode
    return accFunctionsByMode
  },
  {}
)

export default availableFunctionExamples
