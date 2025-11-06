import realtimeByDelayStyle from './realtimeByDelayStyle';
import realtimeByMotStyle from './realtimeByMotStyle';

export { default as realtimeByDelayStyle } from './realtimeByDelayStyle';
export { default as realtimeByLineStyle } from './realtimeByLineStyle';
export { default as realtimeByMotStyle } from './realtimeByMotStyle';
export { default as realtimeSimpleStyle } from './realtimeSimpleStyle';
export * from './realtimeStyle';
export { default as realtimeStyle } from './realtimeStyle';

// backward compatibility
export const realtimeDefaultStyle = realtimeByMotStyle;
export const realtimeDelayStyle = realtimeByDelayStyle;
