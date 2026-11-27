import { Countries } from '@core/countries'
import { TextInput } from '@webapp/components/form'
import Dropdown from '@webapp/components/form/Dropdown'
import { useI18n } from '@webapp/store/system'

type Props = {
  onChangeUser: (params: { prop: string; value: unknown }) => void
  // true when the values come from the access request (or self-registration)
  readOnly: boolean
  user: Record<string, any>
}

const fieldLabelKey = (field: string) => `guest:accessRequestView.fields.props.${field}`

/**
 * Personal info asked when completing the registration: first and last name, institution and country.
 */
export const RegistrationFields = (props: Props) => {
  const { onChangeUser, readOnly, user } = props
  const i18n = useI18n()

  const textField = (field: string, autoComplete?: string) => (
    <TextInput
      autoComplete={autoComplete}
      label={i18n.t(fieldLabelKey(field))}
      name={field}
      onChange={(value) => onChangeUser({ prop: field, value })}
      readOnly={readOnly}
      value={user[field] ?? ''}
    />
  )

  const countryCode = user.country
  return (
    <>
      <div className="guest__form-row">
        {textField('firstName', 'given-name')}
        {textField('lastName', 'family-name')}
      </div>
      <div className="guest__form-row">
        {textField('institution', 'organization')}
        <Dropdown
          className="registration-fields__country"
          disabled={readOnly}
          itemLabel="name"
          itemValue="code"
          items={Countries.list}
          onChange={(item) => onChangeUser({ prop: 'country', value: item?.code ?? '' })}
          label={fieldLabelKey('country')}
          selection={countryCode ? Countries.list.find((item) => item.code === countryCode) : null}
        />
      </div>
    </>
  )
}
