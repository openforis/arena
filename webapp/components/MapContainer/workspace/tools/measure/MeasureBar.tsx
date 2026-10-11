import type { ReactElement } from 'react'
import Button from '@mui/material/Button'
import NativeSelect from '@mui/material/NativeSelect'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import type {
  MeasureMode,
  MeasureUnitOption,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

const NO_VALUE = '—'

export type MeasureBarProps = {
  barRef: (element: HTMLDivElement | null) => void
  mode: MeasureMode
  unit: MeasureUnitOption
  unitOptions: MeasureUnitOption[]
  total: string | null
  perimeter: string | null
  onModeChange: (mode: MeasureMode) => void
  onUnitChange: (unit: MeasureUnitOption) => void
  onDone: () => void
}

/**
 * Floating bar of the measure tool: Distance | Area, running total, units and Done.
 * Leaflet stops mousedown on the bar (see isolateFromMap), so only click and native select events are used.
 * Keys pressed on its buttons reach the workspace shortcuts (Escape ends the tool there); the workspace ignores keys
 * typed in the unit select, so the bar handles Escape there itself.
 * @param {object} props - The component props.
 * @param {Function} props.barRef - Receives the bar element.
 * @param {MeasureMode} props.mode - The active mode.
 * @param {MeasureUnitOption} props.unit - The chosen unit of the mode.
 * @param {MeasureUnitOption[]} props.unitOptions - The units of the mode.
 * @param {string|null} props.total - The running total, null when nothing is measured.
 * @param {string|null} props.perimeter - The perimeter (area mode), null otherwise.
 * @param {Function} props.onModeChange - Called with the selected mode.
 * @param {Function} props.onUnitChange - Called with the selected unit.
 * @param {Function} props.onDone - Called by Done.
 * @returns {React.ReactElement} The bar.
 */
export const MeasureBar = (props: MeasureBarProps): ReactElement => {
  const { barRef, mode, unit, unitOptions, total, perimeter, onModeChange, onUnitChange, onDone } = props
  const t = useI18nT()

  // The test id must sit on the native select (e2e uses selectOption on it)
  const unitInputProps = {
    'aria-label': t('mapWorkspace.measure.units'),
    'data-testid': TestId.mapWorkspace.measureUnit,
  }

  return (
    <Paper
      ref={barRef}
      data-testid={TestId.mapWorkspace.measureBar}
      elevation={4}
      sx={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        p: 0.75,
        maxWidth: 'calc(100% - 24px)',
        fontSize: 13,
        cursor: 'default',
      }}
      onKeyDown={(event) => {
        // useMapShortcuts skips text fields (a select is one) and defaultPrevented events: Escape is handled once
        if (event.key === 'Escape' && event.target instanceof HTMLSelectElement) {
          event.preventDefault()
          onDone()
        }
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        aria-label={t('mapWorkspace.measure.barLabel')}
        onChange={(_event, value: MeasureMode | null) => {
          if (value) onModeChange(value)
        }}
      >
        <ToggleButton value="distance" data-testid={TestId.mapWorkspace.measureModeDistance}>
          {t('mapWorkspace.measure.modes.distance')}
        </ToggleButton>
        <ToggleButton value="area" data-testid={TestId.mapWorkspace.measureModeArea}>
          {t('mapWorkspace.measure.modes.area')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography
        component="strong"
        data-testid={TestId.mapWorkspace.measureTotal}
        sx={{ fontWeight: 700, fontSize: 14, minWidth: 64 }}
      >
        {total ?? NO_VALUE}
      </Typography>

      {perimeter && (
        <Typography
          component="span"
          data-testid={TestId.mapWorkspace.measurePerimeter}
          sx={{ fontSize: 12, color: 'text.secondary' }}
        >
          {t('mapWorkspace.measure.perimeter', { value: perimeter })}
        </Typography>
      )}

      <Typography
        component="span"
        sx={{ fontSize: 12, color: 'text.secondary', display: { xs: 'none', md: 'inline' } }}
      >
        {t('mapWorkspace.measure.hint')}
      </Typography>

      <NativeSelect
        value={unit}
        onChange={(event) => onUnitChange(event.target.value as MeasureUnitOption)}
        inputProps={unitInputProps}
        sx={{ fontSize: 12 }}
      >
        {unitOptions.map((option) => (
          <option key={option} value={option}>
            {t(`mapWorkspace.measure.unitOptions.${option}`)}
          </option>
        ))}
      </NativeSelect>

      <Button size="small" variant="outlined" data-testid={TestId.mapWorkspace.measureDone} onClick={onDone}>
        {t('mapWorkspace.measure.done')}
      </Button>
    </Paper>
  )
}
