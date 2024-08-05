import { TorusGeometryOptions } from './type';
import * as Cesium from 'cesium';
export default class TorusGeometry {
    geometry: Cesium.Geometry | undefined;
    attributes: any;
    positions: Cesium.GeometryAttribute | undefined;
    normals: Cesium.GeometryAttribute | undefined;
    st: Cesium.GeometryAttribute | undefined;
    primitiveType: Cesium.PrimitiveType;
    indices: Uint16Array;
    constructor(torusGeometryOptions: TorusGeometryOptions);
    private createGeometry;
}
