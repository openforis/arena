import type { AiHostingClass } from '@common/ai/policy'
import type { IconName } from '@webapp/components/AppIcon'

// where the data goes; the same icons in the data-location badge and the assistant's provider chip
const iconByHostingClass: Record<AiHostingClass, IconName> = {
  cloud: 'cloud',
  orgHosted: 'organization',
  onDevice: 'laptop',
}

// no location to claim (e.g. the default provider is a local server of another computer)
export const NEUTRAL_HOSTING_ICON: IconName = 'help'

/**
 * Returns the icon of where a provider runs.
 * @param {AiHostingClass|null} [hostingClass] - Hosting class (null or undefined when it is not known).
 */
export const getHostingIcon = (hostingClass?: AiHostingClass | null): IconName =>
  (hostingClass ? iconByHostingClass[hostingClass] : undefined) ?? NEUTRAL_HOSTING_ICON
