import realtimeByDelayStyle from './realtimeByDelayStyle';
import realtimeStyle from './realtimeStyle';

export { default as realtimeByDelayStyle } from './realtimeByDelayStyle';
export { default as realtimeByLineStyle } from './realtimeByLineStyle';
export { default as realtimeSimpleStyle } from './realtimeSimpleStyle';
export * from './realtimeStyle';
export { default as realtimeStyle } from './realtimeStyle';

// backward compatibility
export const realtimeDefaultStyle = realtimeStyle;
export const realtimeDelayStyle = realtimeByDelayStyle;
