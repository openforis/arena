import { useCallback, useState } from 'react'

import { Strings } from '@openforis/arena-core'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import * as StringUtils from '@core/stringUtils'

import { Alert } from '@webapp/components/Alert'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSurveyInfo } from '@webapp/store/survey'

import Identifier from '../identifier'

type Variable = { root?: boolean; nodeDefType?: string }

type Props = {
  expressionNode?: { arguments?: { name?: string; value?: string }[] }
  onConfirm: (expressionNode: object) => void
  variables: Variable[]
}

export const coordinateVarFilterFn = (variable: Variable): boolean =>
  !!variable.root || variable.nodeDefType === NodeDef.nodeDefType.coordinate

export const AreasOfInterestNotDefinedWarning = () => {
  const surveyInfo = useSurveyInfo()
  if (SurveyAreaOfInterest.getAreasOfInterest(surveyInfo).length > 0) return null
  return <Alert severity="warning" text="expressionEditor.areaOfInterestEditor.areasOfInterestNotDefined" />
}

export const CallGeoDistanceToAOIBoundaryEditor = (props: Props) => {
  const { expressionNode, onConfirm, variables } = props

  const surveyInfo = useSurveyInfo()
  const areaNames = SurveyAreaOfInterest.getAreaOfInterestNames(surveyInfo)

  const [initialCoordinateArg, initialAreaNameArg] = expressionNode?.arguments ?? []
  const [coordinateName, setCoordinateName] = useState<string | undefined>(initialCoordinateArg?.name)
  const [areaName, setAreaName] = useState<string | undefined>(
    initialAreaNameArg?.value ? StringUtils.unquote(initialAreaNameArg.value) : undefined
  )

  const confirm = useCallback(
    ({ coordinate, area }: { coordinate?: string; area?: string }) => {
      if (!coordinate || !area) return
      onConfirm(
        Expression.newCall({
          callee: Expression.functionNames.geoDistanceToAOIBoundary,
          params: [Expression.newIdentifier(coordinate), Expression.newLiteral(Strings.quote(area))],
        })
      )
    },
    [onConfirm]
  )

  const onCoordinateChange = useCallback(
    (identifier: { name?: string } | null) => {
      setCoordinateName(identifier?.name)
      confirm({ coordinate: identifier?.name, area: areaName })
    },
    [areaName, confirm]
  )

  const onAreaChange = useCallback(
    (item: { value: string } | null) => {
      setAreaName(item?.value)
      confirm({ coordinate: coordinateName, area: item?.value })
    },
    [confirm, coordinateName]
  )

  const areaItems = areaNames.map((name) => ({ value: name, label: name }))

  return (
    <div className="function-editor">
      <AreasOfInterestNotDefinedWarning />
      <FormItem label="expressionEditor.coordinateAttribute">
        <Identifier
          node={coordinateName ? Expression.newIdentifier(coordinateName) : null}
          onChange={onCoordinateChange}
          variables={variables}
          variablesFilterFn={coordinateVarFilterFn}
        />
      </FormItem>
      <FormItem label="expressionEditor.areaOfInterestEditor.areaOfInterest">
        <Dropdown
          items={areaItems}
          onChange={onAreaChange}
          selection={areaItems.find((item) => item.value === areaName) ?? null}
        />
      </FormItem>
    </div>
  )
}
