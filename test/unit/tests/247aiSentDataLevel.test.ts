import { getSentDataLevel } from '@webapp/components/ai/Assistant/sentDataLevel'

describe('sent data level (247)', () => {
  test('before the first message each area shows its starting level', () => {
    expect(getSentDataLevel({ area: 'help', conversation: null })).toBe('questions')
    expect(getSentDataLevel({ area: 'design', conversation: null })).toBe('schema')
    expect(getSentDataLevel({ area: 'analysis', conversation: null })).toBe('schema')
    expect(getSentDataLevel({ area: 'cleaning', conversation: null })).toBe('data')
  })

  test('Help sends questions only, whatever the stored class', () => {
    expect(getSentDataLevel({ area: 'help', conversation: { dataClass: 'schema' } })).toBe('questions')
    expect(getSentDataLevel({ area: 'help', conversation: { dataClass: 'data' } })).toBe('questions')
  })

  test('Analysis follows its conversation: schema until records enter it', () => {
    expect(getSentDataLevel({ area: 'analysis', conversation: { dataClass: 'schema' } })).toBe('schema')
    expect(getSentDataLevel({ area: 'analysis', conversation: { dataClass: 'data' } })).toBe('data')
    // a conversation saved before the data class existed
    expect(getSentDataLevel({ area: 'analysis', conversation: {} })).toBe('schema')
  })

  test('an unknown stored class counts as record data', () => {
    expect(getSentDataLevel({ area: 'design', conversation: { dataClass: 'secret' } })).toBe('data')
  })

  test('Cleaning sends record data', () => {
    expect(getSentDataLevel({ area: 'cleaning', conversation: { dataClass: 'data' } })).toBe('data')
  })
})
