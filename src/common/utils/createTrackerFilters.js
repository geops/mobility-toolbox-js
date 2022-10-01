/**
 * Return a filter functions based on some parameters of a vehicle.
 *
 * @param {string|Array<string>} line - A list of vehicle's name to filter. Names can be separated by a comma. Ex: 'S1,S2,S3'
 * @param {string|Array<string>} route - A list of vehicle's route (contained in routeIdentifier property) to filter. Indentifiers can be separated by a comma. Ex: 'id1,id2,id3'
 * @param {string|Array<string>} operator  A list of vehicle's operator to filter. Operators can be separated by a comma. Ex: 'SBB,DB'
 * @param {string|Array<string>} type - A list of vehicle's type to filter.
 * @param {Regexp} regexLine - A regex aplly of vehcile's name.
 * @private
 */
const createFilters = (line, route, operator, type, regexLine) => {
  const filterList = [];

  if (!line && !route && !operator && !type && !regexLine) {
    return null;
  }

  if (regexLine) {
    const regexLineList =
      typeof regexLine === 'string' ? [regexLine] : regexLine;
    const lineFilter = (item) => {
      const name =
        item.properties.name ||
        (item.properties.line && item.properties.line.name) ||
        '';
      if (!name) {
        return false;
      }
      return regexLineList.some((regexStr) =>
        new RegExp(regexStr, 'i').test(name),
      );
    };
    filterList.push(lineFilter);
  }

  if (line) {
    const lineFiltersList = typeof line === 'string' ? line.split(',') : line;
    const lineList = lineFiltersList.map((l) =>
      l.replace(/\s+/g, '').toUpperCase(),
    );
    const lineFilter = (item) => {
      const { line: linee, name } = item.properties;
      const lineName = (name || (linee && linee.name) || '').toUpperCase();
      if (!lineName) {
        return false;
      }
      return lineList.includes(lineName);
    };
    filterList.push(lineFilter);
  }

  if (route) {
    const routes = typeof route === 'string' ? route.split(',') : route;
    const routeList = routes.map((item) => parseInt(item, 10));
    const routeFilter = (item) => {
      const routeId = parseInt(
        item.properties.routeIdentifier.split('.')[0],
        10,
      );
      return routeList.includes(routeId);
    };
    filterList.push(routeFilter);
  }

  if (operator) {
    const operatorList = typeof operator === 'string' ? [operator] : operator;
    const operatorFilter = (item) =>
      operatorList.some((op) =>
        new RegExp(op, 'i').test(item.properties.operator),
      );
    filterList.push(operatorFilter);
  }

  if (type) {
    const typeList = typeof type === 'string' ? [type] : type;
    const typeFilter = (item) => {
      const thisType = item.properties.type
      if (!thisType) {
        return false;
      }
      return typeList.includes(thisType);
    }
    filterList.push(typeFilter);
  }

  if (!filterList.length) {
    return null;
  }

  return (t) => {
    for (let i = 0; i < filterList.length; i += 1) {
      if (!filterList[i](t)) {
        return false;
      }
    }
    return true;
  };
};

export default createFilters;
