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
export default function superfilter ( json
                                    , filter
                                    , { matchKeys = true
                                      , insertMarks = false
                                      , filterKeys
                                      , walkKeys
                                      , selectedIndex
                                      } = {}
                                    ) {

  const opts = { matchKeys, insertMarks, filterKeys, walkKeys, selectedIndex }
  const uniqueKey = `${JSON.stringify(json)}|${filter}|${JSON.stringify(opts)}`
  const memoized = resultMemo.get(uniqueKey)
  if(memoized) {
    //console.warn(`--superfilter-- using memoized result for => ${uniqueKey}`)
    return memoized
  }
  if(!contextMemo.has(filter)) {
    try {
      contextMemo.set(filter, { filter, regex: new RegExp(filter, 'ig') })
    } catch(err) {
      //console.warn(`--superfilter-- ${filter} is not an regexable filter, memoizing...`)
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
      //console.warn(`--superfilter-- ${filter} is not an understandable dynamic filter, memoizing...`)
      dynamicFilterMemo.set(filter, false)
    }
  }
  const mutating = { index: -1 }
  const args = [ json, context, opts, mutating ]
  const dynamicFilter = dynamicFilterMemo.get(filter)
  const result = dynamicFilter ? dynamicFilter(...args) : filterData(...args)
  resultMemo.set(uniqueKey, result)
  return result
}


const isPlainObject = (value) => value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)

function createReducer (context, opts, mutating) {
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

    const executeFilter = (target) => filterData(target, context, opts, mutating)
    //const hasKeyMatch = key ? executeFilter(key) : true


    if(key || matchKeys || mustWalk) {
      const filtered = executeFilter(value)
      const _value = filtered //matchKeys && hasKeyMatch ? value : filtered
      if(isObjectReducer) {
        if(_value === undefined)
          return _
        return { ..._, [key]: _value }
      }
      if(filtered === undefined)
        return _
      return [ ..._, filtered ]
    }

    return key ? { [key]: value } : [ value ]
  }
}


function filterData (json, context, opts, mutating) {
  const { filter, regex } = context
  const { matchKeys, filterKeys, walkKeys, insertMarks, selectedIndex } = opts
  const jsonType = typeof json
  switch(jsonType) {
    case 'string':
      if(!regex.test(json))
        return undefined
      mutating.index++
      const match = (insertMarks ? json.replace(regex, '<mark>$&</mark>') : json)
      if(selectedIndex === mutating.index)
        return `<div class="selected">${match}</div>`
      return match
      //return `<div class="selected-${mutating.index}">${match}</div>`
    case 'number':
      if(!json.toString().includes(filter))
        return undefined
      mutating.index++
      return json
    case 'object':
      if(json === null)
        return undefined
      const isArray = json instanceof Array
      const reducee = isArray ? json : Object.entries(json)
      if(reducee.length === 0)
        return undefined
      return reducee.filter((x) => {
        const [ key, value ] = isArray ? [ null, x ] : x
        if(value === undefined)
          return false
        return true

      }).reduce(createReducer(context, opts, mutating), isArray ? _emptyArray : _emptyObject)
    case 'undefined':
      return undefined
    default:
      console.info(`--superfilter-- unmapped data type (${jsonType}) for obj ${json}`)
      return undefined
  }
}

