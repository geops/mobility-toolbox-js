import React, { useEffect } from 'react';

const MapExample = require('../../examples/map.html');

const Documentation = () => {
  useEffect(() => {
    import('../../examples/map.js');
  });

  return (
    <div>
      Docuuuuumentation
      <div dangerouslySetInnerHTML={{ __html: MapExample }} />
    </div>
  );
};

export default Documentation;
