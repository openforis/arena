import { Versions } from '@openforis/arena-core'

import { AppInfo } from '@core/app/appInfo'
import SystemError from '@core/systemError'

interface ArenaMobileCompatibilityRule {
  sinceArenaVersion: string
  minArenaMobileVersion: string
}

/**
 * Each rule declares the lowest arena-mobile version required to submit data once the running
 * arena version reaches sinceArenaVersion. Empty for now - no arena release has needed one yet;
 * add an entry here when a client-facing breaking change (e.g. the node internal-id migration)
 * requires the two to be coordinated, for example:
 *   { sinceArenaVersion: '2.8.0', minArenaMobileVersion: '2.8.0' }
 */
const compatibilityRules: ArenaMobileCompatibilityRule[] = []

/**
 * Returns the minimum arena-mobile version required for the given running arena version,
 * or null if no rule applies yet.
 */
export const getMinRequiredArenaMobileVersion = (
  arenaVersion: string,
  rules: ArenaMobileCompatibilityRule[] = compatibilityRules
): string | null => {
  const applicableRules = rules
    .filter((rule) => Versions.isGreaterThanOrEqual(arenaVersion, rule.sinceArenaVersion))
    .sort((ruleA, ruleB) => Versions.compare(ruleB.sinceArenaVersion, ruleA.sinceArenaVersion))
  return applicableRules[0]?.minArenaMobileVersion ?? null
}

// Versions.isGreaterThanOrEqual (like the rest of the Versions module) accepts an optional "v"
// prefix and treats a missing patch segment as 0; it throws on a value it can't parse at all - an
// uploaded arenaMobileVersion is arbitrary client-supplied data, so that's also "unsupported"
// rather than a server error.
const isVersionSupported = (arenaMobileVersion: string, minArenaMobileVersion: string): boolean => {
  try {
    return Versions.isGreaterThanOrEqual(arenaMobileVersion, minArenaMobileVersion)
  } catch {
    return false
  }
}

/**
 * Throws if the arena-mobile version that produced the uploaded data (read from info.json in the
 * zip) is older than the minimum this running arena version requires.
 * Does nothing if the file was not created by arena-mobile, its version is not applicable
 * (no info.json, e.g. built before arena-mobile started writing one), or no rule applies yet.
 */
export const checkArenaMobileVersionSupported = (
  { info }: { info: any },
  { arenaVersion = AppInfo.currentAppInfo.version, rules = compatibilityRules } = {}
): void => {
  const appInfo = info?.appInfo
  if (appInfo?.appId !== AppInfo.arenaMobileId) return

  const minArenaMobileVersion = getMinRequiredArenaMobileVersion(arenaVersion, rules)
  if (!minArenaMobileVersion) return

  const arenaMobileVersion = appInfo.version
  const isSupported = Boolean(arenaMobileVersion) && isVersionSupported(arenaMobileVersion, minArenaMobileVersion)
  if (!isSupported) {
    throw new SystemError('dataImport.arenaMobileVersionNotSupported', {
      arenaMobileVersion: arenaMobileVersion ?? 'unknown',
      minArenaMobileVersion,
    })
  }
}
