import type {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
} from '../../api/WebSocketAPI';

/**
 * This function returns a WebSocket api callback, and call the onUpdate function with the list of of subscribed objects changes.
 *
 * @param {function(objects: any[])} onUpdate callback when list of subscribed objects changes, called after 100 ms
 * @param {function(object: any)} [getObjectId = true] function returning the id of an object
 * @param {number} [timeout = 100] debounce timeout in ms
 * @private
 */
const debounceWebsocketMessages = (
  onUpdate: (objects: unknown[]) => void,
  getObjectId?: (object: unknown) => string,
  timeout = 100,
): WebSocketAPIMessageCallback<unknown> => {
  const updateTimeout: Record<string, number> = {};

  const objectsById: Record<string, unknown> = {};
  const objects: unknown[] = [];

  return (data: WebSocketAPIMessageEventData<unknown>) => {
    const { content, source } = data;
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
