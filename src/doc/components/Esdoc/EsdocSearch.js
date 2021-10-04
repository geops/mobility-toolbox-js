import React, { useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { TextField } from '@material-ui/core';
import { _getSearchIndex } from './DocBuilderUtils';

const useStyles = makeStyles(() => ({
  filterField: {
    width: '100%',
  },
  searchWrapper: {
    backgroundColor: 'white',
  },
}));

const EsdocSearch = () => {
  const searchIndex = _getSearchIndex();
  const classes = useStyles();
  const [filter, setFilter] = useState('');

  const resultsByKind = useMemo(() => {
    const tmp = {
      class: [],
      method: [],
      member: [],
      function: [],
      variable: [],
      typedef: [],
      external: [],
      file: [],
      test: [],
      testFile: [],
    };
    for (let i = 0; i < searchIndex.length; i += 1) {
      const pair = searchIndex[i];
      if (filter && pair[0].indexOf(filter.toLowerCase()) > -1) {
        const kind = pair[3];
        tmp[kind].push(pair);
      }
    }
    return tmp;
  }, [filter, searchIndex]);

  return (
    <div className={`search-box active ${classes.searchWrapper}`}>
      <TextField
        inputProps={{
          style: {
            padding: 8,
            fontSize: 16,
          },
        }}
        variant="outlined"
        className={classes.filterField}
        placeholder="Search..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul className="search-result">
        {Object.entries(resultsByKind).map(([kind, result]) => {
          return (
            !!result.length && (
              <React.Fragment key={kind}>
                <li className="search-separator">{kind}</li>
                {result.map((pair) => {
                  return (
                    <li>
                      <a href={`/api/${pair[1]}`.replace(/\./g, '%20')}>
                        {pair[2]}
                      </a>
                    </li>
                  );
                })}
              </React.Fragment>
            )
          );
        })}
      </ul>
    </div>
  );
};
export default EsdocSearch;
