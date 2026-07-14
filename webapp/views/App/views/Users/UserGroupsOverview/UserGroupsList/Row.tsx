import React from 'react'

import * as UserGroup from '@core/user/userGroup/userGroup'

import { useSurveyPreferredLang } from '@webapp/store/survey'

/**
 * Minimal shape of a user group list item, as returned by the arena-server user groups list endpoint.
 * Note: `membersCount` is not currently returned by that endpoint (it only returns rows with `props`),
 * so it defaults to 0 below; this is a known, accepted limitation, out of scope to fix here.
 */
type UserGroupRow = {
  uuid: string
  props?: {
    name?: string
    labels?: Record<string, string>
    qualifiers?: { name: string; value: string }[]
  }
  membersCount?: number
}

type Props = {
  row: UserGroupRow
}

/**
 * A single row of the User Groups list table, rendering name, label, qualifiers count and members count.
 *
 * @param props0 - The component props.
 * @param props0.row - The user group to render.
 * @returns {React.ReactElement} - The Row component.
 */
const Row = (props: Props): React.ReactElement => {
  const { row: userGroup } = props
  const preferredLang = useSurveyPreferredLang()

  return (
    <>
      <div>{UserGroup.getName(userGroup)}</div>
      <div>{UserGroup.getLabel(preferredLang, UserGroup.getName(userGroup))(userGroup)}</div>
      <div>{UserGroup.getQualifiers(userGroup).length}</div>
      <div>{userGroup.membersCount ?? 0}</div>
    </>
  )
}

export default Row
