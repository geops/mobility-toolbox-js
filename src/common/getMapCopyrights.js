function getMapCopyrights(map) {
  const { sourceCaches } = map.style;
  let copyrights = [];
  Object.values(sourceCaches).forEach((sourceCache) => {
    if (sourceCache.used) {
      const source = sourceCache.getSource();
      if (source.attribution) {
        copyrights = copyrights.concat(
          source.attribution.split(/(<a.*?<\/a>)/),
        );
      }
    }
  });

  return [...new Set(copyrights.filter((c) => c.trim()))];
}

export default getMapCopyrights;
