import { Style, Fill, Stroke, Circle } from 'ol/style';

const stroke = new Style({
  zIndex: 2,
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: '#000000',
    }),
  }),
  stroke: new Stroke({
    color: '#000000',
    width: 6,
  }),
});

const fill = new Style({
  zIndex: 3,
  image: new Circle({
    radius: 4,
    fill: new Fill({
      color: '#a0a0a0',
    }),
  }),
  stroke: new Stroke({
    color: '#a0a0a0',
    width: 4,
  }),
});

const fullTrajectoryDelaystyle = () => {
  return [stroke, fill];
};

export default fullTrajectoryDelaystyle;
