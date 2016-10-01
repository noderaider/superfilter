const _emptyObject = Object.freeze({})
const _emptyArray = Object.freeze([])

const contextMemo = new Map()
const dynamicFilterMemo = new Map()
const resultMemo = new Map()


/**
 * Superfilters JSON with your search string and options
 * @param  {Object}         json                    A json object.
 * @param  {Object}         filter                  A string filter (could be a function in string format).
 * @param  {Array<Object>}  options                 Options for how to filter.
 * @return {function}                               A json object thats been filtered.
 */
 function _superfilter (json, filter, opts = {}) {
  const uniqueKey = `${json}|${filter}`
  const memoized = resultMemo.get(uniqueKey)
  if(memoized) {
    console.warn('--superfilter-- using memoized result!')
    return memoized
  }
  if(!contextMemo.has(filter)) {
    try {
      contextMemo.set(filter, { filter, regex: new RegExp(filter, 'ig') })
    } catch(err) {
      console.warn(`--superfilter-- ${filter} is not an regexable filter, memoizing...`)
      contextMemo.set(filter, { filter, regex: false })
    }
  }
  const context = contextMemo.get(filter)
  if(!dynamicFilterMemo.has(filter)) {
    try {
      const dynamicFilter = eval(filter)
      const dynamicFilterType = typeof dynamicFilter
      switch(dynamicFilterType) {
        case 'function':
          dynamicFilterMemo.set(filter, dynamicFilter)
        default:
          throw new Error(`Did not evaluate to a parseable type eval('${filter}') === typeof '${dynamicFilterType}'`)
      }
    } catch(err) {
      console.warn(`--superfilter-- ${filter} is not an understandable dynamic filter, memoizing...`)
      dynamicFilterMemo.set(filter, false)
    }
  }
  const args = [ json, context, opts ]
  const dynamicFilter = dynamicFilterMemo.get(filter)
  const result = dynamicFilter ? dynamicFilter(...args) : filterData(...args)
  resultMemo.set(uniqueKey, result)
  return result
}



export default function superfilter ( json
                                    , filter
                                    , { matchKeys = true
                                      , insertMarks = false
                                      , filterKeys
                                      , walkKeys
                                      } = {}
                                    ) {

  const opts = { matchKeys, insertMarks, filterKeys, walkKeys }
  const uniqueKey = `${json}|${filter}|${JSON.stringify(opts)}`
  const memoized = resultMemo.get(uniqueKey)
  if(memoized) {
    console.warn('--superfilter-- using memoized result!')
    return memoized
  }
  if(!contextMemo.has(filter)) {
    try {
      contextMemo.set(filter, { filter, regex: new RegExp(filter, 'ig') })
    } catch(err) {
      console.warn(`--superfilter-- ${filter} is not an regexable filter, memoizing...`)
      contextMemo.set(filter, { filter, regex: false })
    }
  }
  const context = contextMemo.get(filter)
  if(!dynamicFilterMemo.has(filter)) {
    try {
      const dynamicFilter = eval(filter)
      const dynamicFilterType = typeof dynamicFilter
      switch(dynamicFilterType) {
        case 'function':
          dynamicFilterMemo.set(filter, dynamicFilter)
        default:
          throw new Error(`Did not evaluate to a parseable type eval('${filter}') === typeof '${dynamicFilterType}'`)
      }
    } catch(err) {
      console.warn(`--superfilter-- ${filter} is not an understandable dynamic filter, memoizing...`)
      dynamicFilterMemo.set(filter, false)
    }
  }
  const args = [ json, context, opts ]
  const dynamicFilter = dynamicFilterMemo.get(filter)
  const result = dynamicFilter ? dynamicFilter(...args) : filterData(...args)
  resultMemo.set(uniqueKey, result)
  return result
}


const isPlainObject = (value) => value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)

function createReducer (context, opts) {
  const { filter, regex } = context
  const { matchKeys, filterKeys, walkKeys, insertMarks } = opts
  return function recursiveReduce (_, data) {
    let isObjectReducer = data instanceof Array
    let [ key, value ] = isObjectReducer ? data : [ null, data ]
    const isPlainObjectValue = isPlainObject(value)
    const mustWalk = walkKeys ? walkKeys.includes(key) : isPlainObjectValue
    /*
    console.warn(`
--recursiveReduce--
data: ${JSON.stringify(data)}
key: ${key}
value: ${JSON.stringify(value)}
isPlainObjectValue: ${isPlainObjectValue}
mustWalk: ${mustWalk}
`)
*/
    if(filterKeys && key && !filterKeys.includes(key)) {
      return (
        { ..._
        , [key]: value
        }
      )
    }

    const executeFilter = (target) => filterData(target, context, opts)
    const hasKeyMatch = key ? executeFilter(key) : true


    if(key || matchKeys || mustWalk) {
      const filtered = executeFilter(value)
      const _value = matchKeys && hasKeyMatch ? value : filtered
      return isObjectReducer ? (
        { ..._
        , [key]: _value
        }
      ) : (
        [ ..._, filtered ]
      )
    }

    return key ? { [key]: value } : [ value ]
  }
}

function _createReducer (context, opts) {
  const { filter, regex } = context
  const { filterKeys, walkKeys, insertMarks } = opts
  return function recursiveReduce (_, data) {
    let isObjectReducer = data instanceof Array
    let [ key, value ] = isObjectReducer ? data : [ null, data ]
    if(filterKeys && key && !filterKeys.includes(key)) {
      return (
        { ..._
        , [key]: value
        }
      )
    }
    const hasKeyMatch = key ? filterData(key, context, opts) : false
    const filtered = filterData(value, context, opts)
    if(!hasKeyMatch && (filtered === undefined || filtered === _emptyObject || filtered === _emptyArray))
      return _
    else return isObjectReducer ? (
      { ..._
      , [key]: hasKeyMatch ? value : filtered
      }
    ) : (
      [ ..._, filtered ]
    )
  }
}

function _filterData (json, context, opts) {
  const { filter, regex } = context
  const { filterKeys, walkKeys, insertMarks } = opts
  const jsonType = typeof json
  switch(jsonType) {
    case 'string':
      return regex.test(json) ? (insertMarks ? json.replace(regex, '<mark>$&</mark>') : json) :  undefined
    case 'number':
      return json.toString().includes(filter) ? json : undefined
    case 'object':
      if(json === null)
        return undefined
      const isArray = json instanceof Array
      const reducee = isArray ? json : Object.entries(json)
      if(reducee.length === 0)
        return undefined
      return reducee.reduce(createReducer(context, opts), isArray ? _emptyArray : _emptyObject)
    case 'undefined':
      return undefined
    default:
      console.info(`--superfilter-- unmapped data type (${jsonType}) for obj ${json}`)
      return undefined
  }
}

function filterData (json, context, opts) {
  const { filter, regex } = context
  const { matchKeys, filterKeys, walkKeys, insertMarks } = opts
  const jsonType = typeof json
  switch(jsonType) {
    case 'string':
      return regex.test(json) ? (insertMarks ? json.replace(regex, '<mark>$&</mark>') : json) :  undefined
    case 'number':
      return json.toString().includes(filter) ? json : undefined
    case 'object':
      if(json === null)
        return undefined
      const isArray = json instanceof Array
      const reducee = isArray ? json : Object.entries(json)
      if(reducee.length === 0)
        return undefined
      return reducee.filter((x) => {
        const [ key, value ] = isArray ? [ null, x ] : x
        return true

      }).reduce(createReducer(context, opts), isArray ? _emptyArray : _emptyObject)
    case 'undefined':
      return undefined
    default:
      console.info(`--superfilter-- unmapped data type (${jsonType}) for obj ${json}`)
      return undefined
  }
}

