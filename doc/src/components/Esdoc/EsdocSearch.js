import React, { useState, useMemo } from 'react';
import { TextField } from '@mui/material';
import { _getSearchIndex } from './DocBuilderUtils';

function EsdocSearch() {
  const searchIndex = _getSearchIndex();
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
    <div
      className={`search-box active `}
      style={{
        backgroundColor: 'white',
      }}
    >
      <TextField
        inputProps={{
          style: {
            padding: 8,
            fontSize: 16,
          },
        }}
        variant="outlined"
        style={{
          width: '100%',
        }}
        placeholder="Search..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul className="search-result">
        {Object.entries(resultsByKind).map(([kind, result]) => {
          return (!!result.length && (<React.Fragment key={kind}>
            <li className="search-separator">{kind}</li>
            {result.map((pair) => {
              const href = `/doc/${pair[1]}`.replace(/\./g, '%20');
              return (
                <li key={href}>
                  <a href={href}>{pair[2]}</a>
                </li>
              );
            })}
          </React.Fragment>));
        })}
      </ul>
    </div>
  );
}
export default EsdocSearch;
