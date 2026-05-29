/**
 * MapComponents.native.js
 * Módulo nativo que exporta componentes de mapa
 * Só é carregado em Android/iOS, não em Web
 */

import MapView from "react-native-maps";

export { MapView as default, MapView };
export { default as Marker } from "react-native-maps";
export { default as Circle } from "react-native-maps";

export const getMapComponents = () => {
  const Maps = require("react-native-maps");
  return {
    MapView: Maps.default,
    Marker: Maps.Marker,
    Circle: Maps.Circle,
    PROVIDER_GOOGLE: Maps.PROVIDER_GOOGLE,
  };
};
