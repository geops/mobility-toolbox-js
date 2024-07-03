// /* eslint-disable no-underscore-dangle */
// import { FrameState } from 'ol/Map';
// import { toDegrees } from 'ol/math';
// import { toLonLat } from 'ol/proj';
// import LayerRenderer from 'ol/renderer/Layer';
// import GeoJSON from 'ol/format/GeoJSON';
// import { Coordinate } from 'ol/coordinate';
// import { FeatureCallback } from 'ol/renderer/vector';
// import { Feature } from 'ol';
// import { Geometry } from 'ol/geom';
// import { Pixel } from 'ol/pixel';
// import { Map } from 'maplibre-gl';
// import { VECTOR_TILE_FEATURE_PROPERTY } from '../../common';
// import type MaplibreLayer from '../layers/MaplibreLayer';

// /**
//  * @private
//  */
// const formats: {
//   [key: string]: GeoJSON;
// } = {
//   'EPSG:3857': new GeoJSON({
//     featureProjection: 'EPSG:3857',
//   }),
// };

// /**
//  * This class is a renderer for Maplibre Layer to be able to use the native ol
//  * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
//  * @private
//  */
// // @ts-expect-error
// export default class MaplibreLayerRenderer extends LayerRenderer<MaplibreLayer> {
//   getFeaturesAtCoordinate(
//     coordinate: Coordinate | undefined,
//     hitTolerance: number = 5,
//   ): Feature<Geometry>[] {
//     if (!coordinate) {
//       return [];
//     }

//     const layer = this.getLayer();
//     const map = layer.getMapInternal();
//     const { mbMap } = layer;

//     const projection =
//       map?.getView()?.getProjection()?.getCode() || 'EPSG:3857';
//     let features: Feature[] = [];

//     if (!formats[projection]) {
//       formats[projection] = new GeoJSON({
//         featureProjection: projection,
//       });
//     }

//     if (mbMap?.isStyleLoaded()) {
//       const pixel =
//         coordinate && mbMap.project(toLonLat(coordinate) as [number, number]);

//       if (pixel?.x && pixel?.y) {
//         let pixels: [[number, number], [number, number]] | [number, number] = [
//           pixel.x,
//           pixel.y,
//         ];

//         if (hitTolerance) {
//           const [x, y] = pixels as [number, number];
//           pixels = [
//             [x - hitTolerance, y - hitTolerance],
//             [x + hitTolerance, y + hitTolerance],
//           ];
//         }

//         // At this point we get GeoJSON Maplibre feature, we transform it to an OpenLayers
//         // feature to be consistent with other layers.
//         features = (mbMap as Map)
//           .queryRenderedFeatures(
//             pixels,
//             layer.queryRenderedFeaturesOptions || {},
//           )
//           .map((feature) => {
//             const olFeature = formats[projection].readFeature(
//               feature,
//             ) as Feature;
//             if (olFeature) {
//               // We save the original Maplibre feature to avoid losing informations
//               // potentially needed for other functionnality like highlighting
//               // (id, layer id, source, sourceLayer ...)
//               // @ts-expect-error
//               olFeature.set(VECTOR_TILE_FEATURE_PROPERTY, feature);
//             }
//             return olFeature;
//           });
//       }
//     }
//     return features;
//   }

//   // eslint-disable-next-line class-methods-use-this
//   override prepareFrame() {
//     return true;
//   }

//   override renderFrame(frameState: FrameState) {
//     const layer = this.getLayer();
//     const { map, mbMap } = layer;
//     if (!layer || !map || !mbMap) {
//       return null;
//     }

//     const canvas = mbMap.getCanvas();
//     const { viewState } = frameState;

//     const opacity = layer.getOpacity() || 1;
//     canvas.style.opacity = `${opacity}`;

//     // adjust view parameters in Maplibre
//     mbMap.jumpTo({
//       center: toLonLat(viewState.center) as [number, number],
//       zoom: viewState.zoom - 1,
//       bearing: toDegrees(-viewState.rotation),
//     });

//     if (!canvas.isConnected) {
//       // The canvas is not connected to the DOM, request a map rendering at the next animation frame
//       // to set the canvas size.
//       map.render();
//     } else if (
//       canvas.width !== frameState.size[0] ||
//       canvas.height !== frameState.size[1]
//     ) {
//       mbMap.resize();
//     }

//     mbMap.redraw();

//     return mbMap.getContainer();
//   }

//   override getFeatures(pixel: Pixel) {
//     const coordinate = this.getLayer()
//       ?.getMapInternal()
//       ?.getCoordinateFromPixel(pixel);
//     return Promise.resolve(this.getFeaturesAtCoordinate(coordinate));
//   }

//   override forEachFeatureAtCoordinate<Feature>(
//     coordinate: Coordinate,
//     frameState: FrameState,
//     hitTolerance: number,
//     callback: FeatureCallback<Feature>,
//   ): Feature | undefined {
//     const features = this.getFeaturesAtCoordinate(coordinate, hitTolerance);
//     features.forEach((feature) => {
//       // @ts-expect-error
//       callback(feature, this.layer_, feature.getGeometry());
//     });
//     return features?.[0] as Feature;
//   }
// }
