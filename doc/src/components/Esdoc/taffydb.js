/* eslint-disable */
/*

 Software License Agreement (BSD License)
 http://taffydb.com
 Copyright (c)
 All rights reserved.


 Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following condition is met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

/* jslint        browser : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 500,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
*/

// BUILD 193d48d, modified by mmikowski to pass jslint

// Setup TAFFY name space to return an object with methods
let TAFFY;
let exports;
let T;
(function () {
  let typeList;
  let makeTest;
  let idx;
  let typeKey;
  let version;
  let TC;
  let idpad;
  let cmax;
  let API;
  let protectJSON;
  let each;
  let eachin;
  let isIndexable;
  let returnFilter;
  let runFilters;
  let numcharsplit;
  let orderByCol;
  let run;
  let intersection;
  let filter;
  let makeCid;
  let safeForJson;
  let isRegexp;
  let sortArgs;

  if (!TAFFY) {
    // TC = Counter for Taffy DBs on page, used for unique IDs
    // cmax = size of charnumarray conversion cache
    // idpad = zeros to pad record IDs with
    version = '2.7';
    TC = 1;
    idpad = '000000';
    cmax = 1000;
    API = {};

    sortArgs = function (args) {
      const v = Array.prototype.slice.call(args);
      return v.sort();
    };

    protectJSON = function (t) {
      // ****************************************
      // *
      // * Takes: a variable
      // * Returns: the variable if object/array or the parsed variable if JSON
      // *
      // ****************************************
      if (TAFFY.isArray(t) || TAFFY.isObject(t)) {
        return t;
      }
      return JSON.parse(t);
    };

    // gracefully stolen from underscore.js
    intersection = function (array1, array2) {
      return filter(array1, (item) => {
        return array2.indexOf(item) >= 0;
      });
    };

    // gracefully stolen from underscore.js
    filter = function (obj, iterator, context) {
      const results = [];
      if (obj == null) return results;
      if (Array.prototype.filter && obj.filter === Array.prototype.filter)
        return obj.filter(iterator, context);
      each(obj, (value, index, list) => {
        if (iterator.call(context, value, index, list))
          results[results.length] = value;
      });
      return results;
    };

    isRegexp = function (aObj) {
      return Object.prototype.toString.call(aObj) === '[object RegExp]';
    };

    safeForJson = function (aObj) {
      const myResult = T.isArray(aObj) ? [] : T.isObject(aObj) ? {} : null;
      if (aObj === null) return aObj;
      for (const i in aObj) {
        myResult[i] = isRegexp(aObj[i])
          ? aObj[i].toString()
          : T.isArray(aObj[i]) || T.isObject(aObj[i])
          ? safeForJson(aObj[i])
          : aObj[i];
      }
      return myResult;
    };

    makeCid = function (aContext) {
      const myCid = JSON.stringify(aContext);
      if (myCid.match(/regex/) === null) return myCid;
      return JSON.stringify(safeForJson(aContext));
    };

    each = function (a, fun, u) {
      let r;
      let i;
      let x;
      let y;
      // ****************************************
      // *
      // * Takes:
      // * a = an object/value or an array of objects/values
      // * f = a function
      // * u = optional flag to describe how to handle undefined values
      //   in array of values. True: pass them to the functions,
      //   False: skip. Default False;
      // * Purpose: Used to loop over arrays
      // *
      // ****************************************
      if (a && ((T.isArray(a) && a.length === 1) || !T.isArray(a))) {
        fun(T.isArray(a) ? a[0] : a, 0);
      } else {
        for (
          r, i, x = 0, a = T.isArray(a) ? a : [a], y = a.length;
          x < y;
          x++
        ) {
          i = a[x];
          if (!T.isUndefined(i) || u || false) {
            r = fun(i, x);
            if (r === T.EXIT) {
              break;
            }
          }
        }
      }
    };

    eachin = function (o, fun) {
      // ****************************************
      // *
      // * Takes:
      // * o = an object
      // * f = a function
      // * Purpose: Used to loop over objects
      // *
      // ****************************************
      let x = 0;
      let r;
      let i;

      for (i in o) {
        if (o.hasOwnProperty(i)) {
          r = fun(o[i], i, x++);
          if (r === T.EXIT) {
            break;
          }
        }
      }
    };

    API.extend = function (m, f) {
      // ****************************************
      // *
      // * Takes: method name, function
      // * Purpose: Add a custom method to the API
      // *
      // ****************************************
      API[m] = function () {
        return f.apply(this, sortArgs(arguments));
      };
    };

    isIndexable = function (f) {
      let i;
      // Check to see if record ID
      if (T.isString(f) && /[t][0-9]*[r][0-9]*/i.test(f)) {
        return true;
      }
      // Check to see if record
      if (T.isObject(f) && f.___id && f.___s) {
        return true;
      }

      // Check to see if array of indexes
      if (T.isArray(f)) {
        i = true;
        each(f, (r) => {
          if (!isIndexable(r)) {
            i = false;

            return TAFFY.EXIT;
          }
        });
        return i;
      }

      return false;
    };

    runFilters = function (r, filter) {
      // ****************************************
      // *
      // * Takes: takes a record and a collection of filters
      // * Returns: true if the record matches, false otherwise
      // ****************************************
      let match = true;

      each(filter, (mf) => {
        switch (T.typeOf(mf)) {
          case 'function':
            // run function
            if (!mf.apply(r)) {
              match = false;
              return TAFFY.EXIT;
            }
            break;
          case 'array':
            // loop array and treat like a SQL or
            match =
              mf.length === 1
                ? runFilters(r, mf[0])
                : mf.length === 2
                ? runFilters(r, mf[0]) || runFilters(r, mf[1])
                : mf.length === 3
                ? runFilters(r, mf[0]) ||
                  runFilters(r, mf[1]) ||
                  runFilters(r, mf[2])
                : mf.length === 4
                ? runFilters(r, mf[0]) ||
                  runFilters(r, mf[1]) ||
                  runFilters(r, mf[2]) ||
                  runFilters(r, mf[3])
                : false;
            if (mf.length > 4) {
              each(mf, (f) => {
                if (runFilters(r, f)) {
                  match = true;
                }
              });
            }
            break;
        }
      });

      return match;
    };

    returnFilter = function (f) {
      // ****************************************
      // *
      // * Takes: filter object
      // * Returns: a filter function
      // * Purpose: Take a filter object and return a function that can be used to compare
      // * a TaffyDB record to see if the record matches a query
      // ****************************************
      const nf = [];
      if (T.isString(f) && /[t][0-9]*[r][0-9]*/i.test(f)) {
        f = { ___id: f };
      }
      if (T.isArray(f)) {
        // if we are working with an array

        each(f, (r) => {
          // loop the array and return a filter func for each value
          nf.push(returnFilter(r));
        });
        // now build a func to loop over the filters and return true if ANY of the filters match
        // This handles logical OR expressions
        f = function () {
          const that = this;
          let match = false;
          each(nf, (f) => {
            if (runFilters(that, f)) {
              match = true;
            }
          });
          return match;
        };
        return f;
      }
      // if we are dealing with an Object
      if (T.isObject(f)) {
        if (T.isObject(f) && f.___id && f.___s) {
          f = { ___id: f.___id };
        }

        // Loop over each value on the object to prep match type and match value
        eachin(f, (v, i) => {
          // default match type to IS/Equals
          if (!T.isObject(v)) {
            v = {
              is: v,
            };
          }
          // loop over each value on the value object  - if any
          eachin(v, (mtest, s) => {
            // s = match type, e.g. is, hasAll, like, etc
            const c = [];
            let looper;

            // function to loop and apply filter
            looper =
              s === 'hasAll'
                ? function (mtest, func) {
                    func(mtest);
                  }
                : each;

            // loop over each test
            looper(mtest, (mtest) => {
              // su = match success
              // f = match false
              let su = true;
              const f = false;
              let matchFunc;

              // push a function onto the filter collection to do the matching
              matchFunc = function () {
                // get the value from the record
                const mvalue = this[i];
                const eqeq = '==';
                const bangeq = '!=';
                const eqeqeq = '===';
                const lt = '<';
                const gt = '>';
                const lteq = '<=';
                const gteq = '>=';
                const bangeqeq = '!==';
                let r;

                if (typeof mvalue === 'undefined') {
                  return false;
                }

                if (s.indexOf('!') === 0 && s !== bangeq && s !== bangeqeq) {
                  // if the filter name starts with ! as in '!is' then reverse the match logic and remove the !
                  su = false;
                  s = s.substring(1, s.length);
                }
                // get the match results based on the s/match type
                /* jslint eqeq : true */
                r =
                  s === 'regex'
                    ? mtest.test(mvalue)
                    : s === 'lt' || s === lt
                    ? mvalue < mtest
                    : s === 'gt' || s === gt
                    ? mvalue > mtest
                    : s === 'lte' || s === lteq
                    ? mvalue <= mtest
                    : s === 'gte' || s === gteq
                    ? mvalue >= mtest
                    : s === 'left'
                    ? mvalue.indexOf(mtest) === 0
                    : s === 'leftnocase'
                    ? mvalue.toLowerCase().indexOf(mtest.toLowerCase()) === 0
                    : s === 'right'
                    ? mvalue.substring(mvalue.length - mtest.length) === mtest
                    : s === 'rightnocase'
                    ? mvalue
                        .toLowerCase()
                        .substring(mvalue.length - mtest.length) ===
                      mtest.toLowerCase()
                    : s === 'like'
                    ? mvalue.indexOf(mtest) >= 0
                    : s === 'likenocase'
                    ? mvalue.toLowerCase().indexOf(mtest.toLowerCase()) >= 0
                    : s === eqeqeq || s === 'is'
                    ? mvalue === mtest
                    : s === eqeq
                    ? mvalue == mtest
                    : s === bangeqeq
                    ? mvalue !== mtest
                    : s === bangeq
                    ? mvalue != mtest
                    : s === 'isnocase'
                    ? mvalue.toLowerCase
                      ? mvalue.toLowerCase() === mtest.toLowerCase()
                      : mvalue === mtest
                    : s === 'has'
                    ? T.has(mvalue, mtest)
                    : s === 'hasall'
                    ? T.hasAll(mvalue, mtest)
                    : s === 'contains'
                    ? TAFFY.isArray(mvalue) && mvalue.indexOf(mtest) > -1
                    : s.indexOf('is') === -1 &&
                      !TAFFY.isNull(mvalue) &&
                      !TAFFY.isUndefined(mvalue) &&
                      !TAFFY.isObject(mtest) &&
                      !TAFFY.isArray(mtest)
                    ? mtest === mvalue[s]
                    : T[s] && T.isFunction(T[s]) && s.indexOf('is') === 0
                    ? T[s](mvalue) === mtest
                    : T[s] && T.isFunction(T[s])
                    ? T[s](mvalue, mtest)
                    : false;
                /* jslint eqeq : false */
                r = r && !su ? false : !r && !su ? true : r;

                return r;
              };
              c.push(matchFunc);
            });
            // if only one filter in the collection push it onto the filter list without the array
            if (c.length === 1) {
              nf.push(c[0]);
            } else {
              // else build a function to loop over all the filters and return true only if ALL match
              // this is a logical AND
              nf.push(function () {
                const that = this;
                let match = false;
                each(c, (f) => {
                  if (f.apply(that)) {
                    match = true;
                  }
                });
                return match;
              });
            }
          });
        });
        // finally return a single function that wraps all the other functions and will run a query
        // where all functions have to return true for a record to appear in a query result
        f = function () {
          const that = this;
          let match = true;
          // faster if less than  4 functions
          match =
            nf.length === 1 && !nf[0].apply(that)
              ? false
              : nf.length === 2 && (!nf[0].apply(that) || !nf[1].apply(that))
              ? false
              : nf.length === 3 &&
                (!nf[0].apply(that) || !nf[1].apply(that) || !nf[2].apply(that))
              ? false
              : !(
                  nf.length === 4 &&
                  (!nf[0].apply(that) ||
                    !nf[1].apply(that) ||
                    !nf[2].apply(that) ||
                    !nf[3].apply(that))
                );
          if (nf.length > 4) {
            each(nf, (f) => {
              if (!runFilters(that, f)) {
                match = false;
              }
            });
          }
          return match;
        };
        return f;
      }

      // if function
      if (T.isFunction(f)) {
        return f;
      }
    };

    orderByCol = function (ar, o) {
      // ****************************************
      // *
      // * Takes: takes an array and a sort object
      // * Returns: the array sorted
      // * Purpose: Accept filters such as "[col], [col2]" or "[col] desc" and sort on those columns
      // *
      // ****************************************

      const sortFunc = function (a, b) {
        // function to pass to the native array.sort to sort an array
        let r = 0;

        T.each(o, (sd) => {
          // loop over the sort instructions
          // get the column name
          let o;
          let col;
          let dir;
          let c;
          let d;
          o = sd.split(' ');
          col = o[0];

          // get the direction
          dir = o.length === 1 ? 'logical' : o[1];

          if (dir === 'logical') {
            // if dir is logical than grab the charnum arrays for the two values we are looking at
            c = numcharsplit(a[col]);
            d = numcharsplit(b[col]);
            // loop over the charnumarrays until one value is higher than the other
            T.each(c.length <= d.length ? c : d, (x, i) => {
              if (c[i] < d[i]) {
                r = -1;
                return TAFFY.EXIT;
              }
              if (c[i] > d[i]) {
                r = 1;
                return TAFFY.EXIT;
              }
            });
          } else if (dir === 'logicaldesc') {
            // if logicaldesc than grab the charnum arrays for the two values we are looking at
            c = numcharsplit(a[col]);
            d = numcharsplit(b[col]);
            // loop over the charnumarrays until one value is lower than the other
            T.each(c.length <= d.length ? c : d, (x, i) => {
              if (c[i] > d[i]) {
                r = -1;
                return TAFFY.EXIT;
              }
              if (c[i] < d[i]) {
                r = 1;
                return TAFFY.EXIT;
              }
            });
          } else if (dir === 'asec' && a[col] < b[col]) {
            // if asec - default - check to see which is higher
            r = -1;
            return T.EXIT;
          } else if (dir === 'asec' && a[col] > b[col]) {
            // if asec - default - check to see which is higher
            r = 1;
            return T.EXIT;
          } else if (dir === 'desc' && a[col] > b[col]) {
            // if desc check to see which is lower
            r = -1;
            return T.EXIT;
          } else if (dir === 'desc' && a[col] < b[col]) {
            // if desc check to see which is lower
            r = 1;
            return T.EXIT;
          }
          // if r is still 0 and we are doing a logical sort than look to see if one array is longer than the other
          if (r === 0 && dir === 'logical' && c.length < d.length) {
            r = -1;
          } else if (r === 0 && dir === 'logical' && c.length > d.length) {
            r = 1;
          } else if (r === 0 && dir === 'logicaldesc' && c.length > d.length) {
            r = -1;
          } else if (r === 0 && dir === 'logicaldesc' && c.length < d.length) {
            r = 1;
          }

          if (r !== 0) {
            return T.EXIT;
          }
        });
        return r;
      };
      // call the sort function and return the newly sorted array
      return ar && ar.push ? ar.sort(sortFunc) : ar;
    };

    // ****************************************
    // *
    // * Takes: a string containing numbers and letters and turn it into an array
    // * Returns: return an array of numbers and letters
    // * Purpose: Used for logical sorting. String Example: 12ABC results: [12,'ABC']
    // ****************************************
    (function () {
      // creates a cache for numchar conversions
      let cache = {};
      let cachcounter = 0;
      // creates the numcharsplit function
      numcharsplit = function (thing) {
        // if over 1000 items exist in the cache, clear it and start over
        if (cachcounter > cmax) {
          cache = {};
          cachcounter = 0;
        }

        // if a cache can be found for a numchar then return its array value
        return (
          cache[`_${thing}`] ||
          (function () {
            // otherwise do the conversion
            // make sure it is a string and setup so other variables
            const nthing = String(thing);
            const na = [];
            let rv = '_';
            let rt = '';
            let x;
            let xx;
            let c;

            // loop over the string char by char
            for (x = 0, xx = nthing.length; x < xx; x++) {
              // take the char at each location
              c = nthing.charCodeAt(x);
              // check to see if it is a valid number char and append it to the array.
              // if last char was a string push the string to the charnum array
              if ((c >= 48 && c <= 57) || c === 46) {
                if (rt !== 'n') {
                  rt = 'n';
                  na.push(rv.toLowerCase());
                  rv = '';
                }
                rv += nthing.charAt(x);
              } else {
                // check to see if it is a valid string char and append to string
                // if last char was a number push the whole number to the charnum array
                if (rt !== 's') {
                  rt = 's';
                  na.push(parseFloat(rv));
                  rv = '';
                }
                rv += nthing.charAt(x);
              }
            }
            // once done, push the last value to the charnum array and remove the first uneeded item
            na.push(rt === 'n' ? parseFloat(rv) : rv.toLowerCase());
            na.shift();
            // add to cache
            cache[`_${thing}`] = na;
            cachcounter++;
            // return charnum array
            return na;
          })()
        );
      };
    })();

    // ****************************************
    // *
    // * Runs a query
    // ****************************************

    run = function () {
      this.context({
        results: this.getDBI().query(this.context()),
      });
    };

    API.extend('filter', function () {
      // ****************************************
      // *
      // * Takes: takes unlimited filter objects as arguments
      // * Returns: method collection
      // * Purpose: Take filters as objects and cache functions for later lookup when a query is run
      // ****************************************
      const nc = TAFFY.mergeObj(this.context(), { run: null });
      const nq = [];
      each(nc.q, (v) => {
        nq.push(v);
      });
      nc.q = nq;
      // Hadnle passing of ___ID or a record on lookup.
      each(sortArgs(arguments), (f) => {
        nc.q.push(returnFilter(f));
        nc.filterRaw.push(f);
      });

      return this.getroot(nc);
    });

    API.extend('order', function (o) {
      // ****************************************
      // *
      // * Purpose: takes a string and creates an array of order instructions to be used with a query
      // ****************************************

      o = o.split(',');
      const x = [];
      let nc;

      each(o, (r) => {
        x.push(r.replace(/^\s*/, '').replace(/\s*$/, ''));
      });

      nc = TAFFY.mergeObj(this.context(), { sort: null });
      nc.order = x;

      return this.getroot(nc);
    });

    API.extend('limit', function (n) {
      // ****************************************
      // *
      // * Purpose: takes a limit number to limit the number of rows returned by a query. Will update the results
      // * of a query
      // ****************************************
      const nc = TAFFY.mergeObj(this.context(), {});
      let limitedresults;

      nc.limit = n;

      if (nc.run && nc.sort) {
        limitedresults = [];
        each(nc.results, (i, x) => {
          if (x + 1 > n) {
            return TAFFY.EXIT;
          }
          limitedresults.push(i);
        });
        nc.results = limitedresults;
      }

      return this.getroot(nc);
    });

    API.extend('start', function (n) {
      // ****************************************
      // *
      // * Purpose: takes a limit number to limit the number of rows returned by a query. Will update the results
      // * of a query
      // ****************************************
      let nc = TAFFY.mergeObj(this.context(), {});
      let limitedresults;

      nc.start = n;

      if (nc.run && nc.sort && !nc.limit) {
        limitedresults = [];
        each(nc.results, (i, x) => {
          if (x + 1 > n) {
            limitedresults.push(i);
          }
        });
        nc.results = limitedresults;
      } else {
        nc = TAFFY.mergeObj(this.context(), { run: null, start: n });
      }

      return this.getroot(nc);
    });

    API.extend('update', function (arg0, arg1, arg2) {
      // ****************************************
      // *
      // * Takes: a object and passes it off DBI update method for all matched records
      // ****************************************
      let runEvent = true;
      let o = {};
      const args = sortArgs(arguments);
      let that;
      if (
        TAFFY.isString(arg0) &&
        (arguments.length === 2 || arguments.length === 3)
      ) {
        o[arg0] = arg1;
        if (arguments.length === 3) {
          runEvent = arg2;
        }
      } else {
        o = arg0;
        if (args.length === 2) {
          runEvent = arg1;
        }
      }

      that = this;
      run.call(this);
      each(this.context().results, (r) => {
        let c = o;
        if (TAFFY.isFunction(c)) {
          c = c.apply(TAFFY.mergeObj(r, {}));
        } else if (T.isFunction(c)) {
          c = c(TAFFY.mergeObj(r, {}));
        }
        if (TAFFY.isObject(c)) {
          that.getDBI().update(r.___id, c, runEvent);
        }
      });
      if (this.context().results.length) {
        this.context({ run: null });
      }
      return this;
    });
    API.extend('remove', function (runEvent) {
      // ****************************************
      // *
      // * Purpose: removes records from the DB via the remove and removeCommit DBI methods
      // ****************************************
      const that = this;
      let c = 0;
      run.call(this);
      each(this.context().results, (r) => {
        that.getDBI().remove(r.___id);
        c++;
      });
      if (this.context().results.length) {
        this.context({
          run: null,
        });
        that.getDBI().removeCommit(runEvent);
      }

      return c;
    });

    API.extend('count', function () {
      // ****************************************
      // *
      // * Returns: The length of a query result
      // ****************************************
      run.call(this);
      return this.context().results.length;
    });

    API.extend('callback', function (f, delay) {
      // ****************************************
      // *
      // * Returns null;
      // * Runs a function on return of run.call
      // ****************************************
      if (f) {
        const that = this;
        setTimeout(() => {
          run.call(that);
          f.call(that.getroot(that.context()));
        }, delay || 0);
      }

      return null;
    });

    API.extend('get', function () {
      // ****************************************
      // *
      // * Returns: An array of all matching records
      // ****************************************
      run.call(this);
      return this.context().results;
    });

    API.extend('stringify', function () {
      // ****************************************
      // *
      // * Returns: An JSON string of all matching records
      // ****************************************
      return JSON.stringify(this.get());
    });
    API.extend('first', function () {
      // ****************************************
      // *
      // * Returns: The first matching record
      // ****************************************
      run.call(this);
      return this.context().results[0] || false;
    });
    API.extend('last', function () {
      // ****************************************
      // *
      // * Returns: The last matching record
      // ****************************************
      run.call(this);
      return this.context().results[this.context().results.length - 1] || false;
    });

    API.extend('sum', function () {
      // ****************************************
      // *
      // * Takes: column to sum up
      // * Returns: Sums the values of a column
      // ****************************************
      let total = 0;
      const that = this;
      run.call(that);
      each(sortArgs(arguments), (c) => {
        each(that.context().results, (r) => {
          total += r[c] || 0;
        });
      });
      return total;
    });

    API.extend('min', function (c) {
      // ****************************************
      // *
      // * Takes: column to find min
      // * Returns: the lowest value
      // ****************************************
      let lowest = null;
      run.call(this);
      each(this.context().results, (r) => {
        if (lowest === null || r[c] < lowest) {
          lowest = r[c];
        }
      });
      return lowest;
    });

    //  Taffy innerJoin Extension (OCD edition)
    //  =======================================
    //
    //  How to Use
    //  **********
    //
    //  left_table.innerJoin( right_table, condition1 <,... conditionN> )
    //
    //  A condition can take one of 2 forms:
    //
    //    1. An ARRAY with 2 or 3 values:
    //    A column name from the left table, an optional comparison string,
    //    and column name from the right table.  The condition passes if the test
    //    indicated is true.   If the condition string is omitted, '===' is assumed.
    //    EXAMPLES: [ 'last_used_time', '>=', 'current_use_time' ], [ 'user_id','id' ]
    //
    //    2. A FUNCTION:
    //    The function receives a left table row and right table row during the
    //    cartesian join.  If the function returns true for the rows considered,
    //    the merged row is included in the result set.
    //    EXAMPLE: function (l,r){ return l.name === r.label; }
    //
    //  Conditions are considered in the order they are presented.  Therefore the best
    //  performance is realized when the least expensive and highest prune-rate
    //  conditions are placed first, since if they return false Taffy skips any
    //  further condition tests.
    //
    //  Other notes
    //  ***********
    //
    //  This code passes jslint with the exception of 2 warnings about
    //  the '==' and '!=' lines.  We can't do anything about that short of
    //  deleting the lines.
    //
    //  Credits
    //  *******
    //
    //  Heavily based upon the work of Ian Toltz.
    //  Revisions to API by Michael Mikowski.
    //  Code convention per standards in http://manning.com/mikowski
    (function () {
      const innerJoinFunction = (function () {
        let fnCompareList;
        let fnCombineRow;
        let fnMain;

        fnCompareList = function (left_row, right_row, arg_list) {
          let data_lt;
          let data_rt;
          let op_code;
          let error;

          if (arg_list.length === 2) {
            data_lt = left_row[arg_list[0]];
            op_code = '===';
            data_rt = right_row[arg_list[1]];
          } else {
            data_lt = left_row[arg_list[0]];
            op_code = arg_list[1];
            data_rt = right_row[arg_list[2]];
          }

          /* jslint eqeq : true */
          switch (op_code) {
            case '===':
              return data_lt === data_rt;
            case '!==':
              return data_lt !== data_rt;
            case '<':
              return data_lt < data_rt;
            case '>':
              return data_lt > data_rt;
            case '<=':
              return data_lt <= data_rt;
            case '>=':
              return data_lt >= data_rt;
            case '==':
              return data_lt == data_rt;
            case '!=':
              return data_lt != data_rt;
            default:
              throw `${String(op_code)} is not supported`;
          }
          // 'jslint eqeq : false'  here results in
          // "Unreachable '/*jslint' after 'return'".
          // We don't need it though, as the rule exception
          // is discarded at the end of this functional scope
        };

        fnCombineRow = function (left_row, right_row) {
          const out_map = {};
          let i;
          let prefix;

          for (i in left_row) {
            if (left_row.hasOwnProperty(i)) {
              out_map[i] = left_row[i];
            }
          }
          for (i in right_row) {
            if (right_row.hasOwnProperty(i) && i !== '___id' && i !== '___s') {
              prefix = !TAFFY.isUndefined(out_map[i]) ? 'right_' : '';
              out_map[prefix + String(i)] = right_row[i];
            }
          }
          return out_map;
        };

        fnMain = function (table) {
          let right_table;
          let i;
          const arg_list = sortArgs(arguments);
          const arg_length = arg_list.length;
          const result_list = [];
          if (typeof table.filter !== 'function') {
            if (table.TAFFY) {
              right_table = table();
            } else {
              throw 'TAFFY DB or result not supplied';
            }
          } else {
            right_table = table;
          }

          this.context({
            results: this.getDBI().query(this.context()),
          });

          TAFFY.each(this.context().results, (left_row) => {
            right_table.each((right_row) => {
              let arg_data;
              let is_ok = true;
              for (i = 1; i < arg_length; i++) {
                arg_data = arg_list[i];
                if (typeof arg_data === 'function') {
                  is_ok = arg_data(left_row, right_row);
                } else if (typeof arg_data === 'object' && arg_data.length) {
                  is_ok = fnCompareList(left_row, right_row, arg_data);
                } else {
                  is_ok = false;
                }

                if (!is_ok) {
                  break;
                } // short circuit
              }

              if (is_ok) {
                result_list.push(fnCombineRow(left_row, right_row));
              }
            });
          });
          return TAFFY(result_list)();
        };

        return fnMain;
      })();

      API.extend('join', innerJoinFunction);
    })();

    API.extend('max', function (c) {
      // ****************************************
      // *
      // * Takes: column to find max
      // * Returns: the highest value
      // ****************************************
      let highest = null;
      run.call(this);
      each(this.context().results, (r) => {
        if (highest === null || r[c] > highest) {
          highest = r[c];
        }
      });
      return highest;
    });

    API.extend('select', function () {
      // ****************************************
      // *
      // * Takes: columns to select values into an array
      // * Returns: array of values
      // * Note if more than one column is given an array of arrays is returned
      // ****************************************

      const ra = [];
      const args = sortArgs(arguments);
      run.call(this);
      if (arguments.length === 1) {
        each(this.context().results, (r) => {
          ra.push(r[args[0]]);
        });
      } else {
        each(this.context().results, (r) => {
          const row = [];
          each(args, (c) => {
            row.push(r[c]);
          });
          ra.push(row);
        });
      }
      return ra;
    });
    API.extend('distinct', function () {
      // ****************************************
      // *
      // * Takes: columns to select unique alues into an array
      // * Returns: array of values
      // * Note if more than one column is given an array of arrays is returned
      // ****************************************
      const ra = [];
      const args = sortArgs(arguments);
      run.call(this);
      if (arguments.length === 1) {
        each(this.context().results, (r) => {
          const v = r[args[0]];
          let dup = false;
          each(ra, (d) => {
            if (v === d) {
              dup = true;
              return TAFFY.EXIT;
            }
          });
          if (!dup) {
            ra.push(v);
          }
        });
      } else {
        each(this.context().results, (r) => {
          const row = [];
          let dup = false;
          each(args, (c) => {
            row.push(r[c]);
          });
          each(ra, (d) => {
            let ldup = true;
            each(args, (c, i) => {
              if (row[i] !== d[i]) {
                ldup = false;
                return TAFFY.EXIT;
              }
            });
            if (ldup) {
              dup = true;
              return TAFFY.EXIT;
            }
          });
          if (!dup) {
            ra.push(row);
          }
        });
      }
      return ra;
    });
    API.extend('supplant', function (template, returnarray) {
      // ****************************************
      // *
      // * Takes: a string template formated with key to be replaced with values from the rows, flag to determine if we want array of strings
      // * Returns: array of values or a string
      // ****************************************
      const ra = [];
      run.call(this);
      each(this.context().results, (r) => {
        // TODO: The curly braces used to be unescaped
        ra.push(
          template.replace(/\{([^\{\}]*)\}/g, (a, b) => {
            const v = r[b];
            return typeof v === 'string' || typeof v === 'number' ? v : a;
          }),
        );
      });
      return !returnarray ? ra.join('') : ra;
    });

    API.extend('each', function (m) {
      // ****************************************
      // *
      // * Takes: a function
      // * Purpose: loops over every matching record and applies the function
      // ****************************************
      run.call(this);
      each(this.context().results, m);
      return this;
    });
    API.extend('map', function (m) {
      // ****************************************
      // *
      // * Takes: a function
      // * Purpose: loops over every matching record and applies the function, returing the results in an array
      // ****************************************
      const ra = [];
      run.call(this);
      each(this.context().results, (r) => {
        ra.push(m(r));
      });
      return ra;
    });

    T = function (d) {
      // ****************************************
      // *
      // * T is the main TAFFY object
      // * Takes: an array of objects or JSON
      // * Returns a new TAFFYDB
      // ****************************************
      let TOb = [];
      let ID = {};
      let RC = 1;
      let settings = {
        template: false,
        onInsert: false,
        onUpdate: false,
        onRemove: false,
        onDBChange: false,
        storageName: false,
        forcePropertyCase: null,
        cacheSize: 100,
        name: '',
      };
      let dm = new Date();
      let CacheCount = 0;
      let CacheClear = 0;
      let Cache = {};
      let DBI;
      let runIndexes;
      let root;
      // ****************************************
      // *
      // * TOb = this database
      // * ID = collection of the record IDs and locations within the DB, used for fast lookups
      // * RC = record counter, used for creating IDs
      // * settings.template = the template to merge all new records with
      // * settings.onInsert = event given a copy of the newly inserted record
      // * settings.onUpdate = event given the original record, the changes, and the new record
      // * settings.onRemove = event given the removed record
      // * settings.forcePropertyCase = on insert force the proprty case to be lower or upper. default lower, null/undefined will leave case as is
      // * dm = the modify date of the database, used for query caching
      // ****************************************

      runIndexes = function (indexes) {
        // ****************************************
        // *
        // * Takes: a collection of indexes
        // * Returns: collection with records matching indexed filters
        // ****************************************

        let records = [];
        let UniqueEnforce = false;

        if (indexes.length === 0) {
          return TOb;
        }

        each(indexes, (f) => {
          // Check to see if record ID
          if (T.isString(f) && /[t][0-9]*[r][0-9]*/i.test(f) && TOb[ID[f]]) {
            records.push(TOb[ID[f]]);
            UniqueEnforce = true;
          }
          // Check to see if record
          if (T.isObject(f) && f.___id && f.___s && TOb[ID[f.___id]]) {
            records.push(TOb[ID[f.___id]]);
            UniqueEnforce = true;
          }
          // Check to see if array of indexes
          if (T.isArray(f)) {
            each(f, (r) => {
              each(runIndexes(r), (rr) => {
                records.push(rr);
              });
            });
          }
        });
        if (UniqueEnforce && records.length > 1) {
          records = [];
        }

        return records;
      };

      DBI = {
        // ****************************************
        // *
        // * The DBI is the internal DataBase Interface that interacts with the data
        // ****************************************
        dm(nd) {
          // ****************************************
          // *
          // * Takes: an optional new modify date
          // * Purpose: used to get and set the DB modify date
          // ****************************************
          if (nd) {
            dm = nd;
            Cache = {};
            CacheCount = 0;
            CacheClear = 0;
          }
          if (settings.onDBChange) {
            setTimeout(() => {
              settings.onDBChange.call(TOb);
            }, 0);
          }
          if (settings.storageName) {
            setTimeout(() => {
              localStorage.setItem(
                `taffy_${settings.storageName}`,
                JSON.stringify(TOb),
              );
            });
          }
          return dm;
        },
        insert(i, runEvent) {
          // ****************************************
          // *
          // * Takes: a new record to insert
          // * Purpose: merge the object with the template, add an ID, insert into DB, call insert event
          // ****************************************
          const columns = [];
          const records = [];
          const input = protectJSON(i);
          each(input, (v, i) => {
            let nv;
            let o;
            if (T.isArray(v) && i === 0) {
              each(v, (av) => {
                columns.push(
                  settings.forcePropertyCase === 'lower'
                    ? av.toLowerCase()
                    : settings.forcePropertyCase === 'upper'
                    ? av.toUpperCase()
                    : av,
                );
              });
              return true;
            }
            if (T.isArray(v)) {
              nv = {};
              each(v, (av, ai) => {
                nv[columns[ai]] = av;
              });
              v = nv;
            } else if (T.isObject(v) && settings.forcePropertyCase) {
              o = {};

              eachin(v, (av, ai) => {
                o[
                  settings.forcePropertyCase === 'lower'
                    ? ai.toLowerCase()
                    : settings.forcePropertyCase === 'upper'
                    ? ai.toUpperCase()
                    : ai
                ] = v[ai];
              });
              v = o;
            }

            RC++;
            v.___id = `T${String(idpad + TC).slice(-6)}R${String(
              idpad + RC,
            ).slice(-6)}`;
            v.___s = true;
            records.push(v.___id);
            if (settings.template) {
              v = T.mergeObj(settings.template, v);
            }
            TOb.push(v);

            ID[v.___id] = TOb.length - 1;
            if (
              settings.onInsert &&
              (runEvent || TAFFY.isUndefined(runEvent))
            ) {
              settings.onInsert.call(v);
            }
            DBI.dm(new Date());
          });
          return root(records);
        },
        sort(o) {
          // ****************************************
          // *
          // * Purpose: Change the sort order of the DB itself and reset the ID bucket
          // ****************************************
          TOb = orderByCol(TOb, o.split(','));
          ID = {};
          each(TOb, (r, i) => {
            ID[r.___id] = i;
          });
          DBI.dm(new Date());
          return true;
        },
        update(id, changes, runEvent) {
          // ****************************************
          // *
          // * Takes: the ID of record being changed and the changes
          // * Purpose: Update a record and change some or all values, call the on update method
          // ****************************************

          const nc = {};
          let or;
          let nr;
          let tc;
          let hasChange;
          if (settings.forcePropertyCase) {
            eachin(changes, (v, p) => {
              nc[
                settings.forcePropertyCase === 'lower'
                  ? p.toLowerCase()
                  : settings.forcePropertyCase === 'upper'
                  ? p.toUpperCase()
                  : p
              ] = v;
            });
            changes = nc;
          }

          or = TOb[ID[id]];
          nr = T.mergeObj(or, changes);

          tc = {};
          hasChange = false;
          eachin(nr, (v, i) => {
            if (TAFFY.isUndefined(or[i]) || or[i] !== v) {
              tc[i] = v;
              hasChange = true;
            }
          });
          if (hasChange) {
            if (
              settings.onUpdate &&
              (runEvent || TAFFY.isUndefined(runEvent))
            ) {
              settings.onUpdate.call(nr, TOb[ID[id]], tc);
            }
            TOb[ID[id]] = nr;
            DBI.dm(new Date());
          }
        },
        remove(id) {
          // ****************************************
          // *
          // * Takes: the ID of record to be removed
          // * Purpose: remove a record, changes its ___s value to false
          // ****************************************
          TOb[ID[id]].___s = false;
        },
        removeCommit(runEvent) {
          let x;
          // ****************************************
          // *
          // *
          // * Purpose: loop over all records and remove records with ___s = false, call onRemove event, clear ID
          // ****************************************
          for (x = TOb.length - 1; x > -1; x--) {
            if (!TOb[x].___s) {
              if (
                settings.onRemove &&
                (runEvent || TAFFY.isUndefined(runEvent))
              ) {
                settings.onRemove.call(TOb[x]);
              }
              ID[TOb[x].___id] = undefined;
              TOb.splice(x, 1);
            }
          }
          ID = {};
          each(TOb, (r, i) => {
            ID[r.___id] = i;
          });
          DBI.dm(new Date());
        },
        query(context) {
          // ****************************************
          // *
          // * Takes: the context object for a query and either returns a cache result or a new query result
          // ****************************************
          let returnq;
          let cid;
          let results;
          let indexed;
          let limitq;
          let ni;

          if (settings.cacheSize) {
            cid = '';
            each(context.filterRaw, (r) => {
              if (T.isFunction(r)) {
                cid = 'nocache';
                return TAFFY.EXIT;
              }
            });
            if (cid === '') {
              cid = makeCid(
                T.mergeObj(context, { q: false, run: false, sort: false }),
              );
            }
          }
          // Run a new query if there are no results or the run date has been cleared
          if (
            !context.results ||
            !context.run ||
            (context.run && DBI.dm() > context.run)
          ) {
            results = [];

            // check Cache

            if (settings.cacheSize && Cache[cid]) {
              Cache[cid].i = CacheCount++;
              return Cache[cid].results;
            }
            // if no filter, return DB
            if (context.q.length === 0 && context.index.length === 0) {
              each(TOb, (r) => {
                results.push(r);
              });
              returnq = results;
            } else {
              // use indexes

              indexed = runIndexes(context.index);

              // run filters
              each(indexed, (r) => {
                // Run filter to see if record matches query
                if (context.q.length === 0 || runFilters(r, context.q)) {
                  results.push(r);
                }
              });

              returnq = results;
            }
          } else {
            // If query exists and run has not been cleared return the cache results
            returnq = context.results;
          }
          // If a custom order array exists and the run has been clear or the sort has been cleared
          if (context.order.length > 0 && (!context.run || !context.sort)) {
            // order the results
            returnq = orderByCol(returnq, context.order);
          }

          // If a limit on the number of results exists and it is less than the returned results, limit results
          if (
            returnq.length &&
            ((context.limit && context.limit < returnq.length) || context.start)
          ) {
            limitq = [];
            each(returnq, (r, i) => {
              if (!context.start || (context.start && i + 1 >= context.start)) {
                if (context.limit) {
                  ni = context.start ? i + 1 - context.start : i;
                  if (ni < context.limit) {
                    limitq.push(r);
                  } else if (ni > context.limit) {
                    return TAFFY.EXIT;
                  }
                } else {
                  limitq.push(r);
                }
              }
            });
            returnq = limitq;
          }

          // update cache
          if (settings.cacheSize && cid !== 'nocache') {
            CacheClear++;

            setTimeout(() => {
              let bCounter;
              let nc;
              if (CacheClear >= settings.cacheSize * 2) {
                CacheClear = 0;
                bCounter = CacheCount - settings.cacheSize;
                nc = {};
                eachin((r, k) => {
                  if (r.i >= bCounter) {
                    nc[k] = r;
                  }
                });
                Cache = nc;
              }
            }, 0);

            Cache[cid] = { i: CacheCount++, results: returnq };
          }
          return returnq;
        },
      };

      root = function () {
        let iAPI;
        let context;
        // ****************************************
        // *
        // * The root function that gets returned when a new DB is created
        // * Takes: unlimited filter arguments and creates filters to be run when a query is called
        // ****************************************
        // ****************************************
        // *
        // * iAPI is the the method collection valiable when a query has been started by calling dbname
        // * Certain methods are or are not avaliable once you have started a query such as insert -- you can only insert into root
        // ****************************************
        iAPI = TAFFY.mergeObj(TAFFY.mergeObj(API, { insert: undefined }), {
          getDBI() {
            return DBI;
          },
          getroot(c) {
            return root.call(c);
          },
          context(n) {
            // ****************************************
            // *
            // * The context contains all the information to manage a query including filters, limits, and sorts
            // ****************************************
            if (n) {
              context = TAFFY.mergeObj(
                context,
                n.hasOwnProperty('results')
                  ? TAFFY.mergeObj(n, { run: new Date(), sort: new Date() })
                  : n,
              );
            }
            return context;
          },
          extend: undefined,
        });

        context =
          this && this.q
            ? this
            : {
                limit: false,
                start: false,
                q: [],
                filterRaw: [],
                index: [],
                order: [],
                results: false,
                run: null,
                sort: null,
                settings,
              };
        // ****************************************
        // *
        // * Call the query method to setup a new query
        // ****************************************
        each(sortArgs(arguments), (f) => {
          if (isIndexable(f)) {
            context.index.push(f);
          } else {
            context.q.push(returnFilter(f));
          }
          context.filterRaw.push(f);
        });

        return iAPI;
      };

      // ****************************************
      // *
      // * If new records have been passed on creation of the DB either as JSON or as an array/object, insert them
      // ****************************************
      TC++;
      if (d) {
        DBI.insert(d);
      }

      root.insert = DBI.insert;

      root.merge = function (i, key, runEvent) {
        const search = {};
        const finalSearch = [];
        const obj = {};
        runEvent = runEvent || false;
        key = key || 'id';

        each(i, (o) => {
          let existingObject;
          search[key] = o[key];
          finalSearch.push(o[key]);
          existingObject = root(search).first();
          if (existingObject) {
            DBI.update(existingObject.___id, o, runEvent);
          } else {
            DBI.insert(o, runEvent);
          }
        });

        obj[key] = finalSearch;
        return root(obj);
      };

      root.TAFFY = true;
      root.sort = DBI.sort;
      // ****************************************
      // *
      // * These are the methods that can be accessed on off the root DB function. Example dbname.insert;
      // ****************************************
      root.settings = function (n) {
        // ****************************************
        // *
        // * Getting and setting for this DB's settings/events
        // ****************************************
        if (n) {
          settings = TAFFY.mergeObj(settings, n);
          if (n.template) {
            root().update(n.template);
          }
        }
        return settings;
      };

      // ****************************************
      // *
      // * These are the methods that can be accessed on off the root DB function. Example dbname.insert;
      // ****************************************
      root.store = function (n) {
        // ****************************************
        // *
        // * Setup localstorage for this DB on a given name
        // * Pull data into the DB as needed
        // ****************************************
        let r = false;
        let i;
        if (localStorage) {
          if (n) {
            i = localStorage.getItem(`taffy_${n}`);
            if (i && i.length > 0) {
              root.insert(i);
              r = true;
            }
            if (TOb.length > 0) {
              setTimeout(() => {
                localStorage.setItem(
                  `taffy_${settings.storageName}`,
                  JSON.stringify(TOb),
                );
              });
            }
          }
          root.settings({ storageName: n });
        }
        return root;
      };

      // ****************************************
      // *
      // * Return root on DB creation and start having fun
      // ****************************************
      return root;
    };
    // ****************************************
    // *
    // * Sets the global TAFFY object
    // ****************************************
    TAFFY = T;

    // ****************************************
    // *
    // * Create public each method
    // *
    // ****************************************
    T.each = each;

    // ****************************************
    // *
    // * Create public eachin method
    // *
    // ****************************************
    T.eachin = eachin;
    // ****************************************
    // *
    // * Create public extend method
    // * Add a custom method to the API
    // *
    // ****************************************
    T.extend = API.extend;

    // ****************************************
    // *
    // * Creates TAFFY.EXIT value that can be returned to stop an each loop
    // *
    // ****************************************
    TAFFY.EXIT = 'TAFFYEXIT';

    // ****************************************
    // *
    // * Create public utility mergeObj method
    // * Return a new object where items from obj2
    // * have replaced or been added to the items in
    // * obj1
    // * Purpose: Used to combine objs
    // *
    // ****************************************
    TAFFY.mergeObj = function (ob1, ob2) {
      const c = {};
      eachin(ob1, (v, n) => {
        c[n] = ob1[n];
      });
      eachin(ob2, (v, n) => {
        c[n] = ob2[n];
      });
      return c;
    };

    // ****************************************
    // *
    // * Create public utility has method
    // * Returns true if a complex object, array
    // * or taffy collection contains the material
    // * provided in the second argument
    // * Purpose: Used to comare objects
    // *
    // ****************************************
    TAFFY.has = function (var1, var2) {
      let re = false;
      let n;

      if (var1.TAFFY) {
        re = var1(var2);
        if (re.length > 0) {
          return true;
        }
        return false;
      }
      switch (T.typeOf(var1)) {
        case 'object':
          if (T.isObject(var2)) {
            eachin(var2, (v, n) => {
              if (
                re === true &&
                !T.isUndefined(var1[n]) &&
                var1.hasOwnProperty(n)
              ) {
                re = T.has(var1[n], var2[n]);
              } else {
                re = false;
                return TAFFY.EXIT;
              }
            });
          } else if (T.isArray(var2)) {
            each(var2, (v, n) => {
              re = T.has(var1, var2[n]);
              if (re) {
                return TAFFY.EXIT;
              }
            });
          } else if (T.isString(var2)) {
            if (!TAFFY.isUndefined(var1[var2])) {
              return true;
            }
            return false;
          }
          return re;
        case 'array':
          if (T.isObject(var2)) {
            each(var1, (v, i) => {
              re = T.has(var1[i], var2);
              if (re === true) {
                return TAFFY.EXIT;
              }
            });
          } else if (T.isArray(var2)) {
            each(var2, (v2, i2) => {
              each(var1, (v1, i1) => {
                re = T.has(var1[i1], var2[i2]);
                if (re === true) {
                  return TAFFY.EXIT;
                }
              });
              if (re === true) {
                return TAFFY.EXIT;
              }
            });
          } else if (T.isString(var2) || T.isNumber(var2)) {
            re = false;
            for (n = 0; n < var1.length; n++) {
              re = T.has(var1[n], var2);
              if (re) {
                return true;
              }
            }
          }
          return re;
        case 'string':
          if (T.isString(var2) && var2 === var1) {
            return true;
          }
          break;
        default:
          if (T.typeOf(var1) === T.typeOf(var2) && var1 === var2) {
            return true;
          }
          break;
      }

      return false;
    };

    // ****************************************
    // *
    // * Create public utility hasAll method
    // * Returns true if a complex object, array
    // * or taffy collection contains the material
    // * provided in the call - for arrays it must
    // * contain all the material in each array item
    // * Purpose: Used to comare objects
    // *
    // ****************************************
    TAFFY.hasAll = function (var1, var2) {
      const T = TAFFY;
      let ar;
      if (T.isArray(var2)) {
        ar = true;
        each(var2, (v) => {
          ar = T.has(var1, v);
          if (ar === false) {
            return TAFFY.EXIT;
          }
        });
        return ar;
      }
      return T.has(var1, var2);
    };

    // ****************************************
    // *
    // * typeOf Fixed in JavaScript as public utility
    // *
    // ****************************************
    TAFFY.typeOf = function (v) {
      let s = typeof v;
      if (s === 'object') {
        if (v) {
          if (
            typeof v.length === 'number' &&
            !v.propertyIsEnumerable('length')
          ) {
            s = 'array';
          }
        } else {
          s = 'null';
        }
      }
      return s;
    };

    // ****************************************
    // *
    // * Create public utility getObjectKeys method
    // * Returns an array of an objects keys
    // * Purpose: Used to get the keys for an object
    // *
    // ****************************************
    TAFFY.getObjectKeys = function (ob) {
      const kA = [];
      eachin(ob, (n, h) => {
        kA.push(h);
      });
      kA.sort();
      return kA;
    };

    // ****************************************
    // *
    // * Create public utility isSameArray
    // * Returns an array of an objects keys
    // * Purpose: Used to get the keys for an object
    // *
    // ****************************************
    TAFFY.isSameArray = function (ar1, ar2) {
      return !!(
        TAFFY.isArray(ar1) &&
        TAFFY.isArray(ar2) &&
        ar1.join(',') === ar2.join(',')
      );
    };

    // ****************************************
    // *
    // * Create public utility isSameObject method
    // * Returns true if objects contain the same
    // * material or false if they do not
    // * Purpose: Used to comare objects
    // *
    // ****************************************
    TAFFY.isSameObject = function (ob1, ob2) {
      const T = TAFFY;
      let rv = true;

      if (T.isObject(ob1) && T.isObject(ob2)) {
        if (T.isSameArray(T.getObjectKeys(ob1), T.getObjectKeys(ob2))) {
          eachin(ob1, (v, n) => {
            if (
              !(
                (T.isObject(ob1[n]) &&
                  T.isObject(ob2[n]) &&
                  T.isSameObject(ob1[n], ob2[n])) ||
                (T.isArray(ob1[n]) &&
                  T.isArray(ob2[n]) &&
                  T.isSameArray(ob1[n], ob2[n])) ||
                ob1[n] === ob2[n]
              )
            ) {
              rv = false;
              return TAFFY.EXIT;
            }
          });
        } else {
          rv = false;
        }
      } else {
        rv = false;
      }
      return rv;
    };

    // ****************************************
    // *
    // * Create public utility is[DataType] methods
    // * Return true if obj is datatype, false otherwise
    // * Purpose: Used to determine if arguments are of certain data type
    // *
    // * mmikowski 2012-08-06 refactored to make much less "magical":
    // *   fewer closures and passes jslint
    // *
    // ****************************************

    typeList = [
      'String',
      'Number',
      'Object',
      'Array',
      'Boolean',
      'Null',
      'Function',
      'Undefined',
    ];

    makeTest = function (thisKey) {
      return function (data) {
        return TAFFY.typeOf(data) === thisKey.toLowerCase();
      };
    };

    for (idx = 0; idx < typeList.length; idx++) {
      typeKey = typeList[idx];
      TAFFY[`is${typeKey}`] = makeTest(typeKey);
    }
  }
})();

if (typeof exports === 'object') {
  exports.taffy = TAFFY;
}
export default TAFFY;
