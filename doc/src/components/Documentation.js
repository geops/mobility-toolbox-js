import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Esdoc from './Esdoc/Esdoc';

function Documentation() {
  const {
    query: { slug },
  } = useRouter();
  // const params = useParams();
  // const { hash } = useLocation();
  const [path, setPath] = useState('identifiers%20html');

  useEffect(() => {
    if (slug?.length) {
      setPath(slug.join('/').replace(/ /g, '.'));
    }
  }, [slug]);

  return (
    <div
      style={{
        display: 'flex',
        flexGrow: 1,
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <Esdoc path={path} />
    </div>
  );
}

export default React.memo(Documentation);
