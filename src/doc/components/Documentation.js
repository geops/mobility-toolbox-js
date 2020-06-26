import React, { useEffect, useState, useCallback, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useRouteMatch, useLocation } from 'react-router';
import debounce from 'lodash/debounce';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    height: '100%',
  },
  iframe: {
    flexGrow: 1,
    border: 0,
    overflow: 'hidden',
  },
});

const Documentation = () => {
  const classes = useStyles();
  const match = useRouteMatch();
  const { hash } = useLocation();
  const iframeRef = useRef();
  const [isIframeLoaded, setIframeLoaded] = useState(false);
  const [iframePath, setIframePath] = useState('identifiers.html');
  const [iframeHeight, setIframeHeight] = useState(0);

  useEffect(() => {
    const matchPath = match.params.path;
    if (matchPath) {
      setIframePath(matchPath.replace(/ /g, '.') + hash);
    }
  }, [match, hash]);

  // Scroll to the html element defined by the hash.
  useEffect(() => {
    if (!isIframeLoaded || !hash || !iframeHeight) {
      return;
    }

    window.scrollTo(
      0,
      iframeRef.current.contentWindow.document.querySelector(hash).offsetTop -
        50,
    );
  }, [isIframeLoaded, hash, iframeHeight]);

  // Update the height when the iframe is loaded.
  useEffect(() => {
    if (!isIframeLoaded) {
      return;
    }
    // Set the height of the iframe
    setIframeHeight(
      iframeRef.current.contentWindow.document.body.offsetHeight + 50,
    );
  }, [isIframeLoaded]);

  // When iframe is loaded
  const onLoad = useCallback(() => {
    setIframeLoaded(true);

    // Re-adapt the size of the iframe on window resize.
    const onResize = debounce(() => {
      setIframeLoaded(false);
      setIframeLoaded(true);
    }, 500);
    window.addEventListener('resize', onResize);

    // Update isIframeLoaded on unload.
    const onUnload = () => {
      setIframeLoaded(false);
    };
    iframeRef.current.contentWindow.onunload = onUnload;
    return () => {
      window.removeEventListener(onResize);
      iframeRef.current.contentWindow.removeEventListener(onUnload);
    };
  }, []);

  return (
    <div className={classes.root}>
      <iframe
        ref={iframeRef}
        title="API documentation"
        src={`/apidoc/${iframePath}`}
        className={classes.iframe}
        onLoad={onLoad}
        height={iframeHeight}
        scrolling="no"
      />
    </div>
  );
};

export default React.memo(Documentation);
