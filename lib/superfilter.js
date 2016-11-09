'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = superfilter;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _emptyObject = Object.freeze({});
var _emptyArray = Object.freeze([]);

var contextMemo = new Map();
var dynamicFilterMemo = new Map();
var resultMemo = new Map();

/**
 * Superfilters JSON with your search string and options
 * @param  {Object}         json                    A json object.
 * @param  {Object}         filter                  A string filter (could be a function in string format).
 * @param  {Array<Object>}  options                 Options for how to filter.
 * @return {function}                               A json object thats been filtered.
 */
function superfilter(json, filter) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$matchKeys = _ref.matchKeys,
      matchKeys = _ref$matchKeys === undefined ? true : _ref$matchKeys,
      _ref$insertMarks = _ref.insertMarks,
      insertMarks = _ref$insertMarks === undefined ? false : _ref$insertMarks,
      filterKeys = _ref.filterKeys,
      walkKeys = _ref.walkKeys,
      selectedIndex = _ref.selectedIndex;

  var opts = { matchKeys: matchKeys, insertMarks: insertMarks, filterKeys: filterKeys, walkKeys: walkKeys, selectedIndex: selectedIndex };
  var uniqueKey = JSON.stringify(json) + '|' + filter + '|' + JSON.stringify(opts);
  var memoized = resultMemo.get(uniqueKey);
  if (memoized) {
    //console.warn(`--superfilter-- using memoized result for => ${uniqueKey}`)
    return memoized;
  }
  if (!contextMemo.has(filter)) {
    try {
      contextMemo.set(filter, { filter: filter, regex: new RegExp(filter, 'ig') });
    } catch (err) {
      //console.warn(`--superfilter-- ${filter} is not an regexable filter, memoizing...`)
      contextMemo.set(filter, { filter: filter, regex: false });
    }
  }
  var context = contextMemo.get(filter);
  if (!dynamicFilterMemo.has(filter)) {
    try {
      var _dynamicFilter = eval(filter);
      var dynamicFilterType = typeof _dynamicFilter === 'undefined' ? 'undefined' : _typeof(_dynamicFilter);
      switch (dynamicFilterType) {
        case 'function':
          dynamicFilterMemo.set(filter, _dynamicFilter);
        default:
          throw new Error('Did not evaluate to a parseable type eval(\'' + filter + '\') === typeof \'' + dynamicFilterType + '\'');
      }
    } catch (err) {
      //console.warn(`--superfilter-- ${filter} is not an understandable dynamic filter, memoizing...`)
      dynamicFilterMemo.set(filter, false);
    }
  }
  var mutating = { index: -1 };
  var args = [json, context, opts, mutating];
  var dynamicFilter = dynamicFilterMemo.get(filter);
  var result = dynamicFilter ? dynamicFilter.apply(undefined, args) : filterData.apply(undefined, args);
  resultMemo.set(uniqueKey, result);
  return result;
}

var isPlainObject = function isPlainObject(value) {
  return value !== null && value !== undefined && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !Array.isArray(value);
};

function createReducer(context, opts, mutating) {
  var filter = context.filter,
      regex = context.regex;
  var matchKeys = opts.matchKeys,
      filterKeys = opts.filterKeys,
      walkKeys = opts.walkKeys,
      insertMarks = opts.insertMarks;

  return function recursiveReduce(_, data) {
    var isObjectReducer = data instanceof Array;

    var _ref2 = isObjectReducer ? data : [null, data],
        _ref3 = _slicedToArray(_ref2, 2),
        key = _ref3[0],
        value = _ref3[1];

    var isPlainObjectValue = isPlainObject(value);
    var mustWalk = walkKeys ? walkKeys.includes(key) : isPlainObjectValue;
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
    if (filterKeys && key && !filterKeys.includes(key)) {
      return _extends({}, _, _defineProperty({}, key, value));
    }

    var executeFilter = function executeFilter(target) {
      return filterData(target, context, opts, mutating);
    };
    //const hasKeyMatch = key ? executeFilter(key) : true


    if (key || matchKeys || mustWalk) {
      var filtered = executeFilter(value);
      var _value = filtered; //matchKeys && hasKeyMatch ? value : filtered
      if (isObjectReducer) {
        if (_value === undefined) return _;
        return _extends({}, _, _defineProperty({}, key, _value));
      }
      if (filtered === undefined) return _;
      return [].concat(_toConsumableArray(_), [filtered]);
    }

    return key ? _defineProperty({}, key, value) : [value];
  };
}

function filterData(json, context, opts, mutating) {
  var filter = context.filter,
      regex = context.regex;
  var matchKeys = opts.matchKeys,
      filterKeys = opts.filterKeys,
      walkKeys = opts.walkKeys,
      insertMarks = opts.insertMarks,
      selectedIndex = opts.selectedIndex;

  var jsonType = typeof json === 'undefined' ? 'undefined' : _typeof(json);

  var _ret = function () {
    switch (jsonType) {
      case 'string':
        if (!regex.test(json)) return {
            v: undefined
          };
        mutating.index++;
        var match = insertMarks ? json.replace(regex, '<mark>$&</mark>') : json;
        if (selectedIndex === mutating.index) return {
            v: '<div class="selected">' + match + '</div>'
          };
        return {
          v: match
        };
      //return `<div class="selected-${mutating.index}">${match}</div>`
      case 'number':
        if (!json.toString().includes(filter)) return {
            v: undefined
          };
        mutating.index++;
        return {
          v: json
        };
      case 'object':
        if (json === null) return {
            v: undefined
          };
        var isArray = json instanceof Array;
        var reducee = isArray ? json : Object.entries(json);
        if (reducee.length === 0) return {
            v: undefined
          };
        return {
          v: reducee.filter(function (x) {
            var _ref5 = isArray ? [null, x] : x,
                _ref6 = _slicedToArray(_ref5, 2),
                key = _ref6[0],
                value = _ref6[1];

            if (value === undefined) return false;
            return true;
          }).reduce(createReducer(context, opts, mutating), isArray ? _emptyArray : _emptyObject)
        };
      case 'undefined':
        return {
          v: undefined
        };
      default:
        console.info('--superfilter-- unmapped data type (' + jsonType + ') for obj ' + json);
        return {
          v: undefined
        };
    }
  }();

  if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
}