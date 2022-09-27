# mobility-toolbox-js

Toolbox for JavaScript applications in the domains of mobility and logistics.
The tools in this library have been inspired by many projects realized for public transport agencies, mobility providers and logistics companies.

[![npm](https://img.shields.io/npm/v/mobility-toolbox-js.svg?style=flat-square)](https://www.npmjs.com/package/mobility-toolbox-js)
[![Build](https://github.com/geops/mobility-toolbox-js/workflows/Build/badge.svg)](https://github.com/geops/mobility-toolbox-js/actions?query=workflow%3ABuild)
![Vercel](https://vercelbadge.vercel.app/api/geops/mobility-toolbox-js)

## Documentation and examples

Visit https://mobility-toolbox-js.vercel.app/

## Demos

* Display [real-time vehicle positions and prognosis data](https://mobility.portal.geops.io) on a map.
* Search for [stops and stations](https://maps.trafimage.ch) all over the world.
* Get [precise geographic courses](https://routing-demo.geops.io/) for all modes of transport.
* Generate beautiful [schematic](https://mobility.portal.geops.io/world.geops.networkplans) or [topographic](https://mobility.portal.geops.io) maps for public transport, mobility and logistics.

## Install

Install the library and the peer dependencies:

### Using mapbox-gl

```bash
yarn add mobility-toolbox-js ol@6.14.1 mapbox-gl@1 maplibre-gl@npm:empty-npm-package@1.0.0
```

### Using maplibre-gl

```bash
yarn add mobility-toolbox-js ol@6.14.1 maplibre-gl@2 mapbox-gl@npm:empty-npm-package@1.0.0
```

## Development

```bash
yarn install
yarn dev
```

## Deploy

This library website is deployed automatically using [Vercel](https://vercel.com/geops).
For Vercel we have to add the nextjs and raw-loader modules in the dev dependencies of the main package.json.
But those 2 librairies are not need to build the library.

## Version 1.x.x

The master branch is now open for the version 2 development. The version 1 is still available in [1.x.x](https://github.com/geops/mobility-toolbox-js/tree/1.x.x) branch.
