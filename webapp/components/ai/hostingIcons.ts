import type { AiHostingClass } from '@common/ai/policy'

// where the data goes; the same icons in the data-location badge and the assistant's provider chip
const iconByHostingClass: Record<AiHostingClass, string> = {
  cloud: 'icon-cloud',
  orgHosted: 'icon-office',
  onDevice: 'icon-laptop',
}

// no location to claim (e.g. the default provider is a local server of another computer)
export const NEUTRAL_HOSTING_ICON = 'icon-question'

/**
 * Returns the icon of where a provider runs.
 * @param {AiHostingClass|null} [hostingClass] - Hosting class (null or undefined when it is not known).
 * @returns {string} The icon class.
 */
export const getHostingIconClass = (hostingClass?: AiHostingClass | null): string =>
  (hostingClass ? iconByHostingClass[hostingClass] : undefined) ?? NEUTRAL_HOSTING_ICON
