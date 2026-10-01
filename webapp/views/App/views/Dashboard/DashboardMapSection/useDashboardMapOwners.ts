import { useCallback, useEffect, useMemo, useState } from 'react'

import * as User from '@core/user/user'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export type DashboardMapPoint = {
  properties?: {
    recordOwnerUuid?: string
  }
}

export type DashboardMapOwner = {
  uuid: string
  label: string
}

type OwnerUuidsByLayer = Record<string, string[]>

const getPointOwnerUuid = (point: DashboardMapPoint): string | undefined => point.properties?.recordOwnerUuid

const extractOwnerUuids = (points: DashboardMapPoint[]): string[] => {
  const ownerUuids = new Set<string>()
  for (const point of points) {
    const ownerUuid = getPointOwnerUuid(point)
    if (ownerUuid) {
      ownerUuids.add(ownerUuid)
    }
  }
  return [...ownerUuids]
}

const indexUserNamesByUuid = (users: unknown[]): Record<string, string> => {
  const namesByUuid: Record<string, string> = {}
  for (const user of users) {
    const uuid = User.getUuid(user)
    const name = User.getName(user)
    if (uuid && name) {
      namesByUuid[uuid] = name
    }
  }
  return namesByUuid
}

const buildOwners = ({
  ownerUuidsByLayer,
  userNamesByUuid,
}: {
  ownerUuidsByLayer: OwnerUuidsByLayer
  userNamesByUuid: Record<string, string>
}): DashboardMapOwner[] => {
  const ownerUuids = new Set<string>()
  for (const layerOwnerUuids of Object.values(ownerUuidsByLayer)) {
    for (const ownerUuid of layerOwnerUuids) {
      ownerUuids.add(ownerUuid)
    }
  }
  const owners: DashboardMapOwner[] = []
  for (const ownerUuid of ownerUuids) {
    const label = userNamesByUuid[ownerUuid]
    // owners whose name is not available cannot be labeled unambiguously: leave them out of the filter
    if (label) {
      owners.push({ uuid: ownerUuid, label })
    }
  }
  return owners.sort((ownerA, ownerB) => ownerA.label.localeCompare(ownerB.label))
}

const areSameUuids = (uuidsA: string[] = [], uuidsB: string[] = []): boolean =>
  uuidsA.length === uuidsB.length && uuidsA.every((uuid, index) => uuid === uuidsB[index])

/**
 * Collects the record owners of the loaded map features and exposes the client-side owner filter.
 *
 * @returns {object} Owner options, current selection and the points filter to pass to the map layers.
 */
export const useDashboardMapOwners = () => {
  const surveyId = useSurveyId()
  const [ownerUuidsByLayer, setOwnerUuidsByLayer] = useState<OwnerUuidsByLayer>({})
  const [userNamesByUuid, setUserNamesByUuid] = useState<Record<string, string>>({})
  const [selectedOwnerUuid, setSelectedOwnerUuid] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchUserNames = async () => {
      // fetch failures are already notified by the global axios error middleware: without names the filter stays hidden
      const users: unknown[] = await API.fetchUsersBySurvey({ surveyId, onlyAccepted: true }).catch(() => [])
      if (!cancelled) {
        setUserNamesByUuid(indexUserNamesByUuid(users))
      }
    }
    fetchUserNames()
    return () => {
      cancelled = true
    }
  }, [surveyId])

  const onLayerPointsLoaded = useCallback(({ layerKey, points }: { layerKey: string; points: DashboardMapPoint[] }) => {
    const ownerUuids = extractOwnerUuids(points)
    setOwnerUuidsByLayer((ownerUuidsByLayerPrev) =>
      areSameUuids(ownerUuidsByLayerPrev[layerKey], ownerUuids)
        ? ownerUuidsByLayerPrev
        : { ...ownerUuidsByLayerPrev, [layerKey]: ownerUuids }
    )
  }, [])

  const owners = useMemo(
    () => buildOwners({ ownerUuidsByLayer, userNamesByUuid }),
    [ownerUuidsByLayer, userNamesByUuid]
  )

  const pointsFilter = useMemo(
    () => (selectedOwnerUuid ? (point: DashboardMapPoint) => getPointOwnerUuid(point) === selectedOwnerUuid : null),
    [selectedOwnerUuid]
  )

  return { onLayerPointsLoaded, owners, pointsFilter, selectedOwnerUuid, setSelectedOwnerUuid }
}
