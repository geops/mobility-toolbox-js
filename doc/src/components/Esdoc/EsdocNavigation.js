/* eslint-disable react/prop-types */
import React from 'react';
import NavDoc from './NavDoc';

function EsdocNavigation() {
  return (
    <div className="navigation">
      <NavDoc />
    </div>
  );
}

export default React.memo(EsdocNavigation);
