import type { RealtimeTrajectory } from '../../types';
/**
 * Return a filter functions based on some parameters of a vehicle.
 *
 * @param {string|Array<string>} line - A list of vehicle's name to filter. Names can be separated by a comma. Ex: 'S1,S2,S3'
 * @param {string|Array<string} route - A list of vehicle's route (contained in route_identifier property) to filter. Indentifiers can be separated by a comma. Ex: 'id1,id2,id3'
 * @param {string|Array<string} operator  A list of vehicle's operator to filter. Operators can be separated by a comma. Ex: 'SBB,DB'
 * @param {Regexp} regexLine - A regex aplly of vehcile's name.
 * @private
 */
const createRealtimeFilters = (
  line: string | string[],
  route: string | string[],
  operator: string | string[],
  regexLine: string | string[],
): ((trajectory: RealtimeTrajectory) => boolean) | null => {
  const filterList: ((trajectory: RealtimeTrajectory) => boolean)[] = [];

  if (!line && !route && !operator && !regexLine) {
    return null;
  }

  if (regexLine) {
    const regexLineList: string[] =
      typeof regexLine === 'string' ? [regexLine] : regexLine;
    const lineFilter = (item: RealtimeTrajectory) => {
      const name = item.properties.name || item.properties.line?.name || '';
      if (!name) {
        return false;
      }
      return regexLineList.some((regexStr) => {
        return new RegExp(regexStr, 'i').test(name);
      });
    };
    filterList.push(lineFilter);
  }

  if (line) {
    const lineFiltersList = typeof line === 'string' ? line.split(',') : line;
    const lineList = lineFiltersList.map((l) => {
      return l.replace(/\s+/g, '').toUpperCase();
    });
    const lineFilter = (item: RealtimeTrajectory) => {
      const { line: linee, name } = item.properties;
      const lineName = (name || linee?.name || '').toUpperCase();
      if (!lineName) {
        return false;
      }
      return lineList.includes(lineName);
    };
    filterList.push(lineFilter);
  }

  if (route) {
    const routes = typeof route === 'string' ? route.split(',') : route;
    const routeList = routes.map((item) => {
      return parseInt(item, 10);
    });
    const routeFilter = (item: RealtimeTrajectory) => {
      const routeIdentifier =
        item.properties.route_identifier ||
        item.properties.routeIdentifier ||
        '';
      const routeId = parseInt(routeIdentifier.split('.')[0], 10);
      return routeList.includes(routeId);
    };
    filterList.push(routeFilter);
  }

  if (operator) {
    const operatorList = typeof operator === 'string' ? [operator] : operator;
    const operatorFilter = (item: RealtimeTrajectory) => {
      return operatorList.some((op) => {
        // operaotr is the old property tenant is the new one
        const tenant = item.properties.operator || item.properties.tenant || '';
        return new RegExp(op, 'i').test(tenant);
      });
    };
    filterList.push(operatorFilter);
  }

  if (!filterList.length) {
    return null;
  }

  return (item: RealtimeTrajectory) => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < filterList.length; i += 1) {
      if (!filterList[i](item)) {
        return false;
      }
    }
    return true;
  };
};

export default createRealtimeFilters;
