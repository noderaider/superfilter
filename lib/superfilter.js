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
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var uniqueKey = json + '|' + filter;
  var memoized = resultMemo.get(uniqueKey);
  if (memoized) {
    console.warn('--superfilter-- using memoized result!');
    return memoized;
  }
  if (!contextMemo.has(filter)) {
    try {
      contextMemo.set(filter, { filter: filter, regex: new RegExp(filter, 'i') });
    } catch (err) {
      console.warn('--superfilter-- ' + filter + ' is not an regexable filter, memoizing...');
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
      console.warn('--superfilter-- ' + filter + ' is not an understandable dynamic filter, memoizing...');
      dynamicFilterMemo.set(filter, false);
    }
  }
  var args = [json, context, opts];
  var dynamicFilter = dynamicFilterMemo.get(filter);
  var result = dynamicFilter ? dynamicFilter.apply(undefined, args) : filterData.apply(undefined, args);
  resultMemo.set(uniqueKey, result);
  return result;
}

function createReducer(context, opts) {
  var filter = context.filter;
  var regex = context.regex;
  var filterKeys = opts.filterKeys;
  var walkKeys = opts.walkKeys;

  return function recursiveReduce(_, data) {
    var isObjectReducer = data instanceof Array;

    var _ref = isObjectReducer ? data : [null, data];

    var _ref2 = _slicedToArray(_ref, 2);

    var key = _ref2[0];
    var value = _ref2[1];

    if (key && !filterKeys.includes(key)) {
      return _extends({}, _, _defineProperty({}, key, value));
    }
    var hasKeyMatch = key ? filterData(key, context, opts) : false;
    var filtered = filterData(value, context, opts);
    if (!hasKeyMatch && (filtered === undefined || filtered === _emptyObject || filtered === _emptyArray)) return _;else return isObjectReducer ? _extends({}, _, _defineProperty({}, key, hasKeyMatch ? value : filtered)) : [].concat(_toConsumableArray(_), [filtered]);
  };
}

function filterData(json, context, opts) {
  var filter = context.filter;
  var regex = context.regex;
  var filterKeys = opts.filterKeys;
  var walkKeys = opts.walkKeys;

  var jsonType = typeof json === 'undefined' ? 'undefined' : _typeof(json);
  switch (jsonType) {
    case 'string':
      return json.toLowerCase().includes(filter.toLowerCase()) ? json.replace() : undefined;
    case 'number':
      return json.toString().includes(filter) ? json : undefined;
    case 'object':
      if (json === null) return undefined;
      var isArray = json instanceof Array;
      var reducee = isArray ? json : Object.entries(json);
      if (reducee.length === 0) return undefined;
      return reducee.reduce(createReducer(context, opts), isArray ? _emptyArray : _emptyObject);
    case 'undefined':
      return undefined;
    default:
      console.info('--superfilter-- unmapped data type (' + jsonType + ') for obj ' + json);
      return undefined;
  }
}