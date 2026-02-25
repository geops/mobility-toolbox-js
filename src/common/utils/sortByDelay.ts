import type { RealtimeTrajectory } from '../../types';

const sortByDelay = (
  traj1: RealtimeTrajectory,
  traj2: RealtimeTrajectory,
): number => {
  const { cancelled: cancelled1, delay: delay1 } = traj1.properties;
  const { cancelled: cancelled2, delay: delay2 } = traj2.properties;

  if (
    (delay1 === null || delay1 === undefined) &&
    delay2 !== null &&
    delay2 !== undefined
  ) {
    return 1;
  }
  if (
    (delay2 === null || delay2 === undefined) &&
    delay1 !== null &&
    delay1 !== undefined
  ) {
    return -1;
  }

  if (
    delay1 === null ||
    delay1 === undefined ||
    delay2 === null ||
    delay2 === undefined
  ) {
    return 0;
  }

  // We put cancelled train inbetween green and yellow trains
  // >=180000ms corresponds to yellow train
  if (cancelled1 && !cancelled2) {
    return delay2 < 180000 ? -1 : 1;
  }
  if (cancelled2 && !cancelled1) {
    return delay1 < 180000 ? 1 : -1;
  }
  return delay2 - delay1;
};

export default sortByDelay;
