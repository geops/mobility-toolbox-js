import realtimeByDelayStyle from './realtimeByDelayStyle';
import realtimeByMotTypeStyle from './realtimeByMotTypeStyle';

export { default as realtimeByDelayStyle } from './realtimeByDelayStyle';
export { default as realtimeByLineStyle } from './realtimeByLineStyle';
export { default as realtimeByMotTypeStyle } from './realtimeByMotTypeStyle';
export { default as realtimeSimpleStyle } from './realtimeSimpleStyle';
export * from './realtimeStyle';
export { default as realtimeStyle } from './realtimeStyle';

// backward compatibility
export const realtimeDefaultStyle = realtimeByMotTypeStyle;
export const realtimeDelayStyle = realtimeByDelayStyle;
