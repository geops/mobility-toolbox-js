/* eslint-disable react/prop-types */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import PropTypes from 'prop-types';
import { Scrollchor } from 'react-scrollchor';

const propTypes = {
  /**
   * Path to the link, can include an anchor #
   */
  path: PropTypes.string.isRequired,

  /**
   * Children content of the link.
   */
  children: PropTypes.node.isRequired,
};

/**
 * Anchor which returns a Scrollchor element
 * if the path contains an anchor (#), otherwise it returns a <a> element.
 * @param  {string} options.path  Path to the link, can include an anchor #
 * @param  {node} options.children Children content of the link.
 * @return {node} Scrollchor or <a> element
 * @private
 */
function Anchor({ path, children, ...other }) {
  const pathElements = path.split('#');
  if (pathElements[0] === window.location.pathname) {
    const anchor = pathElements[1];
    const to = anchor ? `#${anchor}` : '';

    return (
      <Scrollchor
        to={to}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...other}
      >
        {children}
      </Scrollchor>
    );
  }

  return (
    <a
      href={path}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      {children}
    </a>
  );
}

Anchor.propTypes = propTypes;

export default Anchor;
