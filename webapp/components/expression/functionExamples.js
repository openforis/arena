import * as ProcessUtils from '@core/processUtils'
import * as Expression from '@core/expressionParser/expression'

const functionExamples = {
  [Expression.modes.json]: {
    [Expression.functionNames.categoryItemProp]:
      `cateoryItemProp('category_name', 'prop_name', 'codeLevel1', 'codeLevel2', ...)`,
    [Expression.functionNames.distance]: 'distance(coordinate_attribute_1, coordinate_attribute_2)',
    [Expression.functionNames.first]:
      'first(multiple_attribute_name), first(multiple_entity_name).entity_attribute_name, ...',
    [Expression.functionNames.geoPolygon]:
      'geoPolygon(coordinate_attribute_1, coordinate_attribute_2, ...), geoPolygon(multiple_entity_name.coordinate_attribute), ...',
    [Expression.functionNames.includes]: `includes(multiple_attribute_name, 'value') = true/false`,
    [Expression.functionNames.index]: `index(node_name), index(this), index($context), index(parent(this))`,
    [Expression.functionNames.isEmpty]: `isEmpty(attribute_name) = true/false`,
    [Expression.functionNames.last]:
      'last(multiple_entity_name).entity_attribute_name, last(multiple_attribute_name), ...',
    [Expression.functionNames.ln]: 'ln(10) = 2.302…',
    [Expression.functionNames.log10]: 'log10(100) = 2',
    [Expression.functionNames.max]: 'max(3,1,2) = 3',
    [Expression.functionNames.min]: 'min(3,1) = 1',
    [Expression.functionNames.now]: 'now()',
    [Expression.functionNames.parent]: `parent(this), parent($context), parent(node_name)`,
    [Expression.functionNames.pow]: 'pow(2,3) = 2³ = 8',
    [Expression.functionNames.taxonProp]: `taxonProp('taxonomy_name', 'extra_prop', 'taxon_code')`,
    [Expression.functionNames.uuid]: 'uuid()',
  },
  [Expression.modes.sql]: {
    [Expression.functionNames.avg]: 'avg(variable_name)',
    [Expression.functionNames.count]: 'count(variable_name)',
    [Expression.functionNames.sum]: 'sum(variable_name)',
  },
}

const experimentalFunctions = [Expression.functionNames.geoPolygon]
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
