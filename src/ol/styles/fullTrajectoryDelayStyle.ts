import { Circle, Fill, Stroke, Style } from 'ol/style';

const stroke = new Style({
  image: new Circle({
    fill: new Fill({
      color: '#000000',
    }),
    radius: 5,
  }),
  stroke: new Stroke({
    color: '#000000',
    width: 6,
  }),
  zIndex: 2,
});

const fill = new Style({
  image: new Circle({
    fill: new Fill({
      color: '#a0a0a0',
    }),
    radius: 4,
  }),
  stroke: new Stroke({
    color: '#a0a0a0',
    width: 4,
  }),
  zIndex: 3,
});

/**
 * @private
 */
const fullTrajectoryDelaystyle = (): Style[] => {
  return [stroke, fill];
};

export default fullTrajectoryDelaystyle;
