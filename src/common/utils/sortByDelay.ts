import type { RealtimeTrajectory } from '../../api/typedefs';

/** @private */
const sortByDelay = (
  traj1: RealtimeTrajectory,
  traj2: RealtimeTrajectory,
): number => {
  const props1 = traj1.properties;
  const props2 = traj2.properties;

  if (props1.delay === null && props2.delay !== null) {
    return 1;
  }
  if (props2.delay === null && props1.delay !== null) {
    return -1;
  }

  // We put cancelled train inbetween green and yellow trains
  // >=180000ms corresponds to yellow train
  if (props1.cancelled && !props2.cancelled) {
    return props2.delay < 180000 ? -1 : 1;
  }
  if (props2.cancelled && !props1.cancelled) {
    return props1.delay < 180000 ? 1 : -1;
  }
  return props2.delay - props1.delay;
};

export default sortByDelay;
