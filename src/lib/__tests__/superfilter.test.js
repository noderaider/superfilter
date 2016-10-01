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

  jsonTest( 'matchKeys false does not take keys into account'
          , { fu: 'bar', bar: 'fu' }
          , 'bar'
          , { matchKeys: false }
          , { fu: 'bar' }
          )

  jsonTest( 'walks only deep keys when specified'
          , { foo: { not: 'bar' }, fu: { yep: 'bar' } }
          , 'bar'
          , { walkKeys: [ 'fu' ] }
          , { foo: { not: 'bar' }, fu: { yep: 'bar' } }
          )

  jsonTest( 'filters only on non-deep keys when specified'
          , { foo: 'nada', fu: { yep: 'bar' } }
          , 'nada'
          , { walkKeys: [ 'fu' ] }
          , { foo: 'nada' }
          )

  jsonTest( 'bypasses filtering of non filterKeys when specified'
          , { foo: 'nada', fu: { yep: 'bar' }, bra: 'foo' }
          , 'bar'
          , { filterKeys: [ 'fu', 'bra' ] }
          , { foo: 'nada', fu: { yep: 'bar' } }
          )

  jsonTest( 'walks nested keys and filters on specific key'
          , [ { title: 'foo', children: [ { title: 'bar' } ] }
            , { title: 'bar', children: [ { title: 'foo' } ] }
            ]
          , 'bar'
          , { matchKeys: false, walkKeys: [ 'children' ], filterKeys: [ 'title' ] }
          , [ { title: 'foo', children: [ { title: 'bar' } ] }
            , { title: 'bar' }
            ]
          )


  jsonTest('does not match keys non-matching keys', { foo: 'bar', fu: 'bra' }, 'bra', {}, { fu: 'bra'})



  jsonTest('highlights', { foo: 'bar', fu: 'bra' }, 'br', { insertMarks: true }, { fu: '<mark>br</mark>a'})
})
