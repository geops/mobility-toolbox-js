import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useRouteMatch, useLocation } from 'react-router';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    height: '100%',
  },
  iframe: {
    flexGrow: 1,
    overflowY: 'visible',
    border: 0,
  },
});

const Documentation = () => {
  const classes = useStyles();
  const match = useRouteMatch();
  const { hash } = useLocation();
  let path = 'identifiers.html';
  if (match.params.path) {
    path = match.params.path.replace(/ /g, '.') + hash;
  }

  return (
    <div className={classes.root}>
      <iframe
        title="API documentation"
        src={`/apidoc/${path}`}
        className={classes.iframe}
        onLoad={(evt) => {
          // Set the proper height of the iframe depending on its content.
          const iframe = evt.target;
          const docIframe = evt.target.contentWindow.document;
          const bodyIframe = evt.target.contentWindow.document.body;

          // Set the height of the iframe
          iframe.height = bodyIframe.offsetHeight + 100;

          // Scroll to the active element if there is one
          if (hash) {
            window.scrollTo(0, docIframe.querySelector(hash).offsetTop - 100); // 100 for the header
          }

          // Deactivate default behavior of internals link.
          docIframe.querySelectorAll('a').forEach((a) => {
            if (/http/.test(a.getAttribute('href'))) {
              // if it's an external link we do nothing.
              return;
            }
            // eslint-disable-next-line no-param-reassign
            a.onclick = (event) => {
              event.preventDefault();

              // Points in the url drives react-router crazy.
              const nextLocation = event.target
                .getAttribute('href')
                .replace(/\./g, '%20'); // Replace dots by encoded spaces.
              window.location.href = `/api/${nextLocation}`;

              // If we are on the same page, the iframe is not reloaded so we have to scroll manually.
              // Scroll the window if there is a hash.
              if (/#/.test(nextLocation)) {
                window.scrollTo(
                  0,
                  docIframe.querySelector(window.location.hash).offsetTop - 100, // 100 for the header
                );
              }
            };
          });
        }}
      />
    </div>
  );
};

export default React.memo(Documentation);
