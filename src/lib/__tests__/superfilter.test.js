import superfilter from '../superfilter'

describe('superfilter', () => {
  const jsonTest = (desc, json, filter, opts, expected) => {
    const _desc = `${desc} | filter:${filter} | json:${JSON.stringify(json)} | opts:${JSON.stringify(opts)} | expected:${JSON.stringify(expected)}`
    it(_desc, () => {
      const result = superfilter(json, filter, opts)
      expect(result).toEqual(expected)
    })
  }

  jsonTest('filters on value', { foo: 'bar' }, 'bar', {}, { foo: 'bar'})
  jsonTest('filters only correct value', { foo: 'bar', fu: 'bra' }, 'bra', {}, { fu: 'bra'})


  jsonTest( 'bypasses filtering of non filterKeys when specified'
          , { foo: 'nada', fu: { yep: 'bar' }, bra: 'foo' }
          , 'bar'
          , { filterKeys: [ 'fu', 'bra' ] }
          , { foo: 'nada', fu: { yep: 'bar' } }
          )

  jsonTest('does not match keys non-matching keys', { foo: 'bar', fu: 'bra' }, 'bra', {}, { fu: 'bra'})
  jsonTest('highlights', { foo: 'bar', fu: 'bra' }, 'br', { insertMarks: true }, { fu: '<mark>br</mark>a'})
  jsonTest('selects', { foo: 'bar', fu: 'bra', ju: 'bra', du: 'bra', su: 'bra' }, 'br', { insertMarks: true, selectedIndex: 2 }, { fu: '<mark>br</mark>a', ju: '<mark>br</mark>a', du: '<div class="selected"><mark>br</mark>a</div>', su: '<mark>br</mark>a' })
  jsonTest('selects only leafs', { fu: 'foo', br: { foo: 'bar', fu: 'bra', ju: 'bra', du: 'bra', su: 'bra' } }, 'br', { insertMarks: true, selectedIndex: 2 }, { br: { fu: '<mark>br</mark>a', ju: '<mark>br</mark>a', du: '<div class="selected"><mark>br</mark>a</div>', su: '<mark>br</mark>a' } })
})
