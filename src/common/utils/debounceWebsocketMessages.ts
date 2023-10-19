import type {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
} from '../api/WebSocketAPI';

/**
 * This function returns a WebSocket api callback, and call the onUpdate function with the list of of subscribed objects changes.
 *
 * @param {function(objects: any[])} onUpdate callback when list of subscribed objects changes, called after 100 ms
 * @param {function(object: any)} [getObjectId = true] function returning the id of an object
 * @param {number} [timeout = 100] debounce timeout in ms
 * @private
 */
const debounceWebsocketMessages = (
  onUpdate: (objects: any[]) => void,
  getObjectId?: (object: any) => string,
  timeout = 100,
): WebSocketAPIMessageCallback<any> => {
  const updateTimeout: {
    [key: string]: number;
  } = {};

  const objectsById: {
    [key: string]: any;
  } = {};
  const objects: any[] = [];

  return (data: WebSocketAPIMessageEventData<any>) => {
    const { source, content } = data;
    if (updateTimeout[source]) {
      window.clearTimeout(updateTimeout[source]);
    }

    if (getObjectId) {
      objectsById[getObjectId(content)] = content;
    } else {
      objects.push(content);
    }

    updateTimeout[source] = window.setTimeout(() => {
      const objectToReturn = getObjectId ? Object.values(objectsById) : objects;
      onUpdate(objectToReturn);
    }, timeout);
  };
};

export default debounceWebsocketMessages;
