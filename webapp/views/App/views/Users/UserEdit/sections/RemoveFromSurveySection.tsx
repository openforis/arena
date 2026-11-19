import { ButtonDelete } from '@webapp/components'

import { UserEditSection } from '../UserEditSection'

type Props = {
  onRemove: () => void
  surveyName: string
}

/**
 * Revokes the access of the user to the current survey; kept apart from the other actions.
 */
export const RemoveFromSurveySection = (props: Props) => {
  const { onRemove, surveyName } = props
  return (
    <UserEditSection
      danger
      description="usersView:profile.removeFromSurveyDescription"
      descriptionParams={{ survey: surveyName }}
      id="user-edit-remove"
      title="userView.removeFromSurvey"
    >
      <div className="user-edit-section__actions">
        <ButtonDelete className="btn-remove-user" label="userView.removeFromSurvey" onClick={onRemove} />
      </div>
    </UserEditSection>
  )
}
