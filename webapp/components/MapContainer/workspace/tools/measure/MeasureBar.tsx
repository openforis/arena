import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react'
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

// Compact segmented look of the mockup: sentence case (MUI uppercases by default), white selected segment on a track
const toggleSx = {
  bgcolor: 'var(--color-surface-variant)',
  p: '2px',
  gap: '2px',
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontSize: 12,
    fontWeight: 600,
    border: 0,
    borderRadius: '6px !important',
    px: 1.5,
    py: 0.25,
    color: 'text.secondary',
  },
  '& .MuiToggleButton-root.Mui-selected': { bgcolor: 'var(--color-surface)', color: 'var(--color-primary)' },
  '& .MuiToggleButton-root.Mui-selected:hover': { bgcolor: 'var(--color-surface)' },
}

export type MeasureBarProps = {
  barRef: (element: HTMLDivElement | null) => void
  mode: MeasureMode
  unit: MeasureUnitOption
  unitOptions: MeasureUnitOption[]
  total: string | null
  perimeter: string | null
  showHint: boolean
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
 * @param {boolean} props.showHint - Whether the usage hint fits (false on compact maps).
 * @param {Function} props.onModeChange - Called with the selected mode.
 * @param {Function} props.onUnitChange - Called with the selected unit.
 * @param {Function} props.onDone - Called by Done.
 * @returns {React.ReactElement} The bar.
 */
export const MeasureBar = (props: MeasureBarProps): ReactElement => {
  const { barRef, mode, unit, unitOptions, total, perimeter, showHint, onModeChange, onUnitChange, onDone } = props
  const t = useI18nT()

  // The test id must sit on the native select (e2e uses selectOption on it)
  const unitInputProps = {
    'aria-label': t('mapWorkspace.measure.units'),
    'data-testid': TestId.mapWorkspace.measureUnit,
  }

  /**
   * Handles Escape typed in the unit select, which the workspace shortcuts ignore.
   * @param {React.KeyboardEvent} event - The key event.
   * @returns {void}
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // useMapShortcuts skips text fields (a select is one) and defaultPrevented events: Escape is handled once
    if (event.key === 'Escape' && event.target instanceof HTMLSelectElement) {
      event.preventDefault()
      onDone()
    }
  }

  /**
   * Selects the mode of the toggle, ignoring the deselect click on the active one.
   * @param {React.MouseEvent} _event - The click event.
   * @param {MeasureMode|null} value - The clicked mode, null when the active one was clicked.
   * @returns {void}
   */
  const onToggleChange = (_event: unknown, value: MeasureMode | null): void => {
    if (value) onModeChange(value)
  }

  /**
   * Reports the unit chosen in the select.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event.
   * @returns {void}
   */
  const onSelectChange = (event: ChangeEvent<HTMLSelectElement>): void =>
    onUnitChange(event.target.value as MeasureUnitOption)

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
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        gap: 1.5,
        p: 0.75,
        borderRadius: 1,
        // absolutely positioned at 50%: without an explicit width it would shrink the select and the Done button
        width: 'max-content',
        maxWidth: 'calc(100% - 24px)',
        fontSize: 13,
        cursor: 'default',
      }}
      onKeyDown={onKeyDown}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        aria-label={t('mapWorkspace.measure.barLabel')}
        onChange={onToggleChange}
        sx={toggleSx}
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
        aria-live="polite"
        sx={{ fontWeight: 700, fontSize: 14, minWidth: 64, flexShrink: 0 }}
      >
        {total ?? NO_VALUE}
      </Typography>

      {perimeter && (
        <Typography
          component="span"
          data-testid={TestId.mapWorkspace.measurePerimeter}
          sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }}
        >
          {t('mapWorkspace.measure.perimeter', { value: perimeter })}
        </Typography>
      )}

      {showHint && (
        <Typography
          component="span"
          sx={{ fontSize: 12, color: 'text.secondary', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {t('mapWorkspace.measure.hint')}
        </Typography>
      )}

      <NativeSelect
        value={unit}
        onChange={onSelectChange}
        inputProps={unitInputProps}
        sx={{ fontSize: 12, height: 30, flexShrink: 0 }}
      >
        {unitOptions.map((option) => (
          <option key={option} value={option}>
            {t(`mapWorkspace.measure.unitOptions.${option}`)}
          </option>
        ))}
      </NativeSelect>

      <Button
        size="small"
        variant="outlined"
        sx={{ height: 30, textTransform: 'none', flexShrink: 0 }}
        data-testid={TestId.mapWorkspace.measureDone}
        onClick={onDone}
      >
        {t('mapWorkspace.measure.done')}
      </Button>
    </Paper>
  )
}
