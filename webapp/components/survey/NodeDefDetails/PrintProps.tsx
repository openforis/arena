import React, { useMemo } from 'react'
import { Box } from '@mui/material'

import * as NodeDef from '@core/survey/nodeDef'

import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { useNodeDefEditReadOnly } from './store'

type NodeDefEditState = {
  nodeDef: Parameters<typeof NodeDef.getPrintOrientation>[0]
}

type PrintPropsProps = {
  state: NodeDefEditState
  Actions: { setProp: (args: { state: NodeDefEditState; key: string; value: string | null }) => void }
}

const ORIENTATION_DEFAULT = ''

export const PrintProps = (props: PrintPropsProps) => {
  const { state, Actions } = props
  const i18n = useI18n()
  const readOnlyLocked = useNodeDefEditReadOnly()
  const canEditSurvey = useAuthCanEditSurvey()
  const readOnly = readOnlyLocked || !canEditSurvey

  const nodeDef = state.nodeDef
  const value = NodeDef.getPrintOrientation(nodeDef) ?? ORIENTATION_DEFAULT

  const items = useMemo(
    () => [
      { value: ORIENTATION_DEFAULT, label: i18n.t('nodeDefEdit.printProps.orientations.default') },
      { value: 'portrait', label: i18n.t('nodeDefEdit.printProps.orientations.portrait') },
      { value: 'landscape', label: i18n.t('nodeDefEdit.printProps.orientations.landscape') },
    ],
    [i18n]
  )

  return (
    <Box className="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <FormItem
        label="nodeDefEdit.printProps.printOrientation.label"
        info="nodeDefEdit.printProps.printOrientation.info"
      >
        <Dropdown
          disabled={readOnly}
          clearable={false}
          items={items}
          selection={items.find((item) => item.value === value) ?? items[0]}
          onChange={(item) =>
            Actions.setProp({
              state,
              key: NodeDef.propKeys.printOrientation,
              value: item?.value ? item.value : null,
            })
          }
        />
      </FormItem>
    </Box>
  )
}
