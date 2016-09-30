import superfilter from '../superfilter'

describe('superfilter', () => {
  it('is a function', () => { expect(typeof superfilter).toBe('function') })

  const jsonTest = (desc, json, filter, opts, expected) => {
    const _desc = `${desc} | filter:${filter} | json:${JSON.stringify(json)} | opts:${JSON.stringify(opts)} | expected:${JSON.stringify(expected)}`
    it(_desc, () => {
      const result = superfilter(json, filter, opts)
      expect(result).toEqual(expected)
    })
  }

  jsonTest('filters on key', { foo: 'bar' }, 'foo', {}, { foo: 'bar'})
  jsonTest('filters on value', { foo: 'bar' }, 'bar', {}, { foo: 'bar'})
  jsonTest('filters only correct key', { foo: 'bar', fu: 'bra' }, 'foo', {}, { foo: 'bar'})
  jsonTest('filters only correct value', { foo: 'bar', fu: 'bra' }, 'bra', {}, { fu: 'bra'})

  jsonTest('highlights', { foo: 'bar', fu: 'bra' }, 'br', { insertMarks: true }, { fu: '<mark>br</mark>a'})
})
