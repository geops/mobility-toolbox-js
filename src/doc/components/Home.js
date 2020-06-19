import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';

function Home() {
  const [source, setSource] = useState(null);
  useEffect(() => {
    fetch('../../../README.md')
      .then((response) => response.text())
      .then((text) => {
        setSource(text);
      });
  }, []);
  return source && <Markdown source={source} />;
}
export default Home;
