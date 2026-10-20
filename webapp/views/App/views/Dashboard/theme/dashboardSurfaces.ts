import { themeColors } from '@webapp/theme/tokens'

const RADIUS_PX = 8

export const dashboardSurfaces = {
  card: {
    borderRadius: `${RADIUS_PX}px`,
    border: `1px solid ${themeColors.outline}`,
    backgroundColor: themeColors.surface,
    boxShadow: 'none',
    minWidth: 220,
    flex: 1,
    overflow: 'hidden',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderRadius: `${RADIUS_PX}px`,
    border: `1px solid ${themeColors.outline}`,
    backgroundColor: themeColors.surface,
    padding: '1rem',
  },
  sectionTitle: {
    margin: 0,
    textTransform: 'none',
    color: themeColors.onPrimaryContainer,
    fontWeight: 600,
    fontSize: '1rem',
  },
  sectionToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
    border: 0,
    padding: 0,
    backgroundColor: 'transparent',
    textAlign: 'left',
    letterSpacing: 'inherit',
    color: 'inherit',
    fontWeight: 'inherit',
    fontSize: 'inherit',
    '&:focus-visible': {
      outline: `2px solid ${themeColors.onPrimaryContainer}`,
      outlineOffset: '2px',
    },
  },
  sectionToggleIcon: {
    transition: 'transform 160ms ease',
  },
  sectionToggleIconCollapsed: {
    transform: 'rotate(180deg)',
  },
  kpiActionHover: {
    transition: 'background-color 160ms ease',
    '&:hover': {
      backgroundColor: themeColors.primaryContainerLow,
    },
  },
  detailDivider: {
    borderTop: `1px solid ${themeColors.outline}`,
  },
} as const
