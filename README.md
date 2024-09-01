# Cesium Transformer
A powerful npm package built on top of Cesium, enabling advanced geometric transformations for Model, Primitive, and Cesium3DTileset.


### Installation
Install the package via npm:

```bash
npm install cesium-transformer
```
Install the package via pnpm:

```bash
pnpm install cesium-transformer
```

### Usage

- **Transformer({viewer, element, boundingSphere})**
  - Applies a geometric transformation to the specified element in the Cesium scene.
  
  - **Parameters**:
    - `viewer` (*Cesium.Viewer*): The Cesium `Viewer` instance where the transformation will be applied.
    - `element` (*Cesium.Model*, *Cesium.Primitive*, *Cesium.Cesium3DTileset*): The target element to be transformed. This can be a model, primitive, or 3D tileset.
    - `boundingSphere` (*Cesium.BoundingSphere*): The bounding sphere that defines the area of the element that will be transformed.
  
  - **Example**:
    ```javascript
    import Transformer from 'cesium-transformer';

    const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883), 1000);

    const transformer = new Transformer({
      viewer, element, boundingSphere
    });
    ```
    ![translation](./assets/translation.gif)
    ![rotation](./assets/rotation.gif)
    ![scale](./assets/scale.gif)
  
  - **functions**

    - **changeMode(mode)**

      - Changes the current transformation mode to either 'translate', 'rotate', or 'scale'.

      - **Parameters**:

        - mode (string): The transformation mode to switch to. Accepted values are 'translation', 'rotation', and 'scale'.
      - **Example**:
         ```javascript
          transformer.changeMode('translation');  // Switches to translation mode
          transformer.changeMode('rotation');  // Switches to rotation mode
          transformer.changeMode('scale');   // Switches to scaling mode
         ```

    - **destory**

      - destory the transformer

      - **Example**:
         ```javascript
          transformer.destory()
         ```
