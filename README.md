## superfilter

A function to filter all the things. Utilizes heavy memoization to quickly filter JSON string / object / array data in flexible ways.

[![Build Status](https://travis-ci.org/noderaider/superfilter.svg?branch=master)](https://travis-ci.org/noderaider/superfilter)
[![codecov](https://codecov.io/gh/noderaider/superfilter/branch/master/graph/badge.svg)](https://codecov.io/gh/noderaider/superfilter)

[![NPM](https://nodei.co/npm/superfilter.png?stars=true&downloads=true)](https://nodei.co/npm/superfilter/)

### Install

`npm install -S superfilter`

### Dependencies

**none**

### Usage

```js

import superfilter from 'superfilter'

const data = (
  { foo: 'bar'
  , kung: (
      { fu: (
          { bar: 'foo'
          , fuji: (
              [ 1
              , 2
              , { coo: 'car'
                , __type__: 'something'
                } 
              ]
            )
          } 
        )
      }
    )
  }
)

const print = _ => console.info(JSON.stringify(_))

print(superfilter(data, 2))
// { kung: { fu: { fuji: [ 2 ] } } }

print(superfilter(data, `x => Object.keys(x).includes('foo')`)
// { foo: 'bar' }

```

### Options

The third parameter an options object to tweak how you filter:


optionName    | type                          | description
==========    | ====                          | ===========
`filterKeys`  | `undefined` | `Array<string>` | Only keys supplied will be used in filtering values. (`undefined` => filter on all keys)
`walkKeys`    | `undefined` | `Array<string>` | Only keys supplied will be used in recursive traversal. (`undefined` => walk all paths)

