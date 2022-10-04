import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const vegaTypes = {
  nominal: 'nominal',
  quantitative: 'quantitative',
  temporal: 'temporal',
}

const dimensionTypeByNodeDefType = {
  [NodeDef.nodeDefType.text]: vegaTypes.nominal,
  [NodeDef.nodeDefType.coordinate]: vegaTypes.nominal,
  [NodeDef.nodeDefType.date]: vegaTypes.temporal,
  [NodeDef.nodeDefType.time]: vegaTypes.temporal,
  [NodeDef.nodeDefType.decimal]: vegaTypes.quantitative,
  [NodeDef.nodeDefType.entity]: vegaTypes.quantitative,
  [NodeDef.nodeDefType.file]: vegaTypes.nominal,
  [NodeDef.nodeDefType.integer]: vegaTypes.quantitative,
  [NodeDef.nodeDefType.code]: vegaTypes.nominal,
  [NodeDef.nodeDefType.taxon]: vegaTypes.nominal,
  [NodeDef.nodeDefType.text]: vegaTypes.nominal,
}

const baseDimension = ({ nodeDef, language, nodeDefLabelType }) => ({
  name: NodeDef.getName(nodeDef),
  value: NodeDef.getName(nodeDef),
  label: NodeDef.getLabel(nodeDef, language, nodeDefLabelType),
  icon: NodeDefUIProps.getIconByType(NodeDef.getType(nodeDef)),
  type: vegaTypes.nominal,
})

const baseParser = ({ nodeDef, language, nodeDefLabelType }) => {
  return [
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
      type: dimensionTypeByNodeDefType[NodeDef.getType(nodeDef)] || vegaTypes.nominal,
    },
  ]
}

// code
const parserCode = ({ nodeDef, language, nodeDefLabelType }) => {
  return [
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
    },
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
      name: `${NodeDef.getName(nodeDef)}_label`,
      value: `${NodeDef.getName(nodeDef)}_label`,
      label: `${NodeDef.getLabel(nodeDef, language, nodeDefLabelType)}${
        nodeDefLabelType === NodeDef.NodeDefLabelTypes.name ? '_label' : ' (Label)'
      }`,
    },
  ]
}

// taxon
const parserTaxon = ({ nodeDef, language, nodeDefLabelType }) => {
  return [
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
    },
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
      name: `${NodeDef.getName(nodeDef)}_scientific_name`,
      value: `${NodeDef.getName(nodeDef)}_scientific_name`,
      label: `${NodeDef.getLabel(nodeDef, language, nodeDefLabelType)}${
        nodeDefLabelType === NodeDef.NodeDefLabelTypes.name ? '_scientific_name' : ' (Scientific Name)'
      }`,
    },
  ]
}
// file
const parserFile = ({ nodeDef, language, nodeDefLabelType }) => {
  return [
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
      name: `${NodeDef.getName(nodeDef)}_file_uuid`,
      value: `${NodeDef.getName(nodeDef)}_file_uuid`,
      label: `${NodeDef.getLabel(nodeDef, language, nodeDefLabelType)}${
        nodeDefLabelType === NodeDef.NodeDefLabelTypes.name ? '_file_uuid' : ' (UUID)'
      }`,
    },
    {
      ...baseDimension({ nodeDef, language, nodeDefLabelType }),
      name: `${NodeDef.getName(nodeDef)}_file_name`,
      value: `${NodeDef.getName(nodeDef)}_file_name`,
      label: `${NodeDef.getLabel(nodeDef, language, nodeDefLabelType)}${
        nodeDefLabelType === NodeDef.NodeDefLabelTypes.name ? '_file_name' : ' (File name)'
      }`,
    },
  ]
}

const parsers = {
  [NodeDef.nodeDefType.boolean]: baseParser,
  [NodeDef.nodeDefType.coordinate]: baseParser,
  [NodeDef.nodeDefType.date]: baseParser,
  [NodeDef.nodeDefType.time]: baseParser,
  [NodeDef.nodeDefType.decimal]: baseParser,
  [NodeDef.nodeDefType.entity]: baseParser,
  [NodeDef.nodeDefType.file]: parserFile,
  [NodeDef.nodeDefType.code]: parserCode,
  [NodeDef.nodeDefType.integer]: baseParser,
  [NodeDef.nodeDefType.taxon]: parserTaxon,
  [NodeDef.nodeDefType.text]: baseParser,
}

// index.js

const parseNodeDefToDimension = ({ nodeDef, language, nodeDefLabelType }) => {
  return parsers[NodeDef.getType(nodeDef)]
    ? parsers[NodeDef.getType(nodeDef)]({ nodeDef, language, nodeDefLabelType })
    : baseParser({ nodeDef, language, nodeDefLabelType })
}

const getSelfAttributesAndAncestors = ({ nodeDefUuid, survey, language, nodeDefLabelType }) => {
  let groupedOptions = []

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const children = Survey.getNodeDefChildren(nodeDef)(survey)
  const attributes = children.filter((child) => !NodeDef.isEntity(child))

  const options = attributes.flatMap((attribute) =>
    parseNodeDefToDimension({ nodeDef: attribute, language, nodeDefLabelType })
  )

  groupedOptions.push({
    label: NodeDef.getLabel(nodeDef, language, nodeDefLabelType),
    options: options,
  })

  const parentUuid = NodeDef.getParentUuid(nodeDef)
  if (parentUuid) {
    groupedOptions = groupedOptions.concat(
      getSelfAttributesAndAncestors({ nodeDefUuid: parentUuid, survey, language, nodeDefLabelType })
    )
  }

  return groupedOptions
}

export default getSelfAttributesAndAncestors
