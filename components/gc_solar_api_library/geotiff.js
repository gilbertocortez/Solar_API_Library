// --------------------------------------------------------------------------------------------------------------------------------------------
//
//  Developed by:
//    Gilberto Cortez
//
//  Website:
//    InteractiveUtopia.com
//
//  Description:
//    - Functions to process GeoTIFF Data
//
// --------------------------------------------------------------------------------------------------------------------------------------------
// Load and render GeoTiff from URL
// --------------------------------------------------------------------------------------------------------------------------------------------
async function loadAndRenderGeoTIFF(
    url,
    isMask = false,
    layerId = "",
    month = null,
    day = null,
    hour = null
  ) {
    try {
      // Fetch the GeoTIFF file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoTIFF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
  
      // Parse the GeoTIFF file
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const numBands = image.getSamplesPerPixel();
  
      // Set null values for other layer types
      if (layerId !== "hourlyShade") {
        hour = null;
      }
      if (layerId !== "monthlyFlux" && layerId !== "hourlyShade") {
        month = null;
      }
  
      let rastersOptions = {};
      if (layerId === "monthlyFlux") {
        rastersOptions = { samples: [month] };
        console.log("Month is: " + month);
      }
      if (layerId === "hourlyShade") {
        console.log("Month is: " + month);
        console.log("Hour is: " + hour);
      }
      const rasters = await image.readRasters(rastersOptions);
  
      // Extract geospatial metadata
      const fileDirectory = image.getFileDirectory();
      const geoKeys = image.getGeoKeys();
      const bbox = image.getBoundingBox(); // This gives you the bounding box as [minX, minY, maxX, maxY]
  
      // Find the target div by its ID
      const canvasDiv = document.getElementById("canvas_div");
      if (!canvasDiv) {
        console.error('Div with ID "canvas_div" not found.');
        return null;
      }
  
      if (
        layerId == "hourlyShade" &&
        rasters[hour][0] === 0 &&
        rasters[hour][rasters[0].length - 1] === 0
      ) {
        // Create a black canvas
        const blackCanvas = document.createElement("canvas");
        blackCanvas.width = 399; // Set to your desired default width
        blackCanvas.height = 400; // Set to your desired default height
        const blackCtx = blackCanvas.getContext("2d");
        blackCtx.fillStyle = "black";
        blackCtx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
  
        // If it's not a mask, append the black canvas to the div; otherwise, do nothing
        if (!isMask) {
          if (!canvasDiv) {
            console.error('Div with ID "canvas_div" not found.');
            return null;
          }
          canvasDiv.appendChild(blackCanvas); // Append the black canvas to the div only if it's not a mask
        }
  
        // Return the black canvas and an empty bounding box
        return { canvas: blackCanvas, bbox };
      }
  
      // Create a new canvas element dynamically
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
  
      // Set canvas size
      canvas.width = image.getWidth();
      canvas.height = image.getHeight();
  
      // Create ImageData
      let imageData = ctx.createImageData(canvas.width, canvas.height);
      let data = imageData.data;
      let bandData = rasters[0];
  
      if (layerId == "hourlyShade") {
        if (hour === null) {
          hour = 12;
        }
        bandData = rasters[hour];
        //console.error(bandData);
      }
  
      let min = bandData[0],
        max = bandData[0];
  
      // Find the actual min and max values
      for (let i = 0; i < bandData.length; i++) {
        if (bandData[i] < min) min = bandData[i];
        if (bandData[i] > max) max = bandData[i];
      }
      //Scale the raster values to 0-255 based on actual min and max
      for (let i = 0; i < bandData.length; i++) {
        let normalizedValue = (bandData[i] - min) / (max - min);
        let color = valueToColor(normalizedValue, layerId);
        let index = i * 4; // Position in the ImageData array
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255; // Alpha channel
      }
  
      // Function to map a normalized value (0-1) to a color
      // Function to map a normalized value (0-1) to a color based on the layer ID
      function valueToColor(value, layerId) {
        // Determine the color palette based on the layer ID
        let palette;
        switch (layerId) {
          case "dsm":
            palette = rainbowPalette;
            break;
          case "rgb":
            palette = ironPalette;
            break;
          case "annualFlux":
            palette = ironPalette;
            break;
          case "monthlyFlux":
            palette = ironPalette;
            break;
          case "hourlyShade":
            palette = sunlightPalette;
            break;
          default:
            palette = binaryPalette; // Default or unrecognized layer uses binary palette
        }
  
        // Convert the normalized value to an index for the color palette
        const index = Math.min(
          palette.length - 1,
          Math.floor(value * palette.length)
        );
        const hexColor = palette[index];
  
        // Convert hex color to RGB
        let r = parseInt(hexColor.substring(0, 2), 16);
        let g = parseInt(hexColor.substring(2, 4), 16);
        let b = parseInt(hexColor.substring(4, 6), 16);
  
        return { r, g, b };
      }
  
      // Render the ImageData to the canvas
      ctx.putImageData(imageData, 0, 0);
  
      // If it's not a mask, append the canvas to the div; otherwise, do nothing
      if (!isMask) {
        if (!canvasDiv) {
          console.error('Div with ID "canvas_div" not found.');
          return null;
        }
        canvasDiv.appendChild(canvas); // Append the canvas to the div only if it's not a mask
      }
  
      // Optionally, return the canvas element for further use
      let return_object = { canvas, bbox };
      console.log(return_object);
      return return_object;
    } catch (error) {
      console.error("Failed to load or render the GeoTIFF:", error);
      return null;
    }
  }
  
  // --------------------------------------------------------------------------------------------------------------------------------------------
  function applyMaskToOverlay(overlayCanvas, maskCanvas) {
    // Create a new canvas to hold the resized mask
    const resizedMaskCanvas = document.createElement("canvas");
    const resizedMaskCtx = resizedMaskCanvas.getContext("2d");
  
    // Set the dimensions of the resized mask to match the overlay
    resizedMaskCanvas.width = overlayCanvas.width;
    resizedMaskCanvas.height = overlayCanvas.height;
  
    // Draw the original mask onto the resized mask canvas, scaling it to fit
    resizedMaskCtx.drawImage(
      maskCanvas,
      0,
      0,
      maskCanvas.width,
      maskCanvas.height,
      0,
      0,
      resizedMaskCanvas.width,
      resizedMaskCanvas.height
    );
  
    // Now, use the resized mask for the overlay operations
    const overlayCtx = overlayCanvas.getContext("2d");
    const overlayData = overlayCtx.getImageData(
      0,
      0,
      overlayCanvas.width,
      overlayCanvas.height
    );
    const maskData = resizedMaskCtx.getImageData(
      0,
      0,
      resizedMaskCanvas.width,
      resizedMaskCanvas.height
    );
  
    // Apply the resized mask to the overlay
    for (let i = 0; i < overlayData.data.length; i += 4) {
      // Assuming mask is grayscale, use the red channel for alpha value
      const maskAlpha = maskData.data[i];
      // Set alpha channel of overlay based on mask
      overlayData.data[i + 3] = maskAlpha;
    }
  
    // Put the modified image data back onto the overlay canvas
    overlayCtx.putImageData(overlayData, 0, 0);
  }
  
  function GeoTIFFOverlay(bounds, canvas, map) {
    this.bounds_ = bounds;
    this.canvas_ = canvas;
    this.map_ = map;
    this.div_ = null;
    this.setMap(map);
  }
  
  function toggleAllOverlays() {
    if (!checkboxDisplayOverlays) return;
  
    overlays.forEach((overlay) => {
      if (checkboxDisplayOverlays.checked) {
        overlay.setMap(map); // Show the overlay
      } else {
        overlay.setMap(null); // Hide the overlay
      }
    });
  }
  
  // --------------------------------------------------------------------------------------------------------------------------------------------
  let div = 1;
  var onGoogleMapsLoaded = () => {
    GeoTIFFOverlay.prototype = new google.maps.OverlayView();
  
    // ---------------------------------------------------
    // On Overlay Add
    // ---------------------------------------------------
  
    GeoTIFFOverlay.prototype.onAdd = function () {
      this.div_ = document.createElement("div");
      this.div_.style.borderStyle = "none";
      this.div_.style.borderWidth = "0px";
      this.div_.setAttribute("id", "overlay_" + div);
      this.div_.style.position = "absolute";
  
      div++;
  
      // Attach the canvas to the overlay's div
      this.div_.appendChild(this.canvas_);
  
      // Add the overlay's div to the map's overlay pane
      var panes = this.getPanes();
      panes.overlayLayer.appendChild(this.div_);
    };
  
    // ---------------------------------------------------
    // On Map ReDraw
    // ---------------------------------------------------
    GeoTIFFOverlay.prototype.draw = function () {
      var overlayProjection = this.getProjection();
  
      var swBound = this.bounds_.getSouthWest();
      var neBound = this.bounds_.getNorthEast();
  
      // Use the SW and NE points of the overlay to find the corresponding pixel locations on the map
      var sw = overlayProjection.fromLatLngToDivPixel(swBound);
      var ne = overlayProjection.fromLatLngToDivPixel(neBound);
  
      var currentZoom = this.map_.getZoom();
  
      var currentZoom = map.getZoom();
  
      var minZoom = 17; // Minimum zoom level to show the overlay
      var maxZoom = 20; // Maximum zoom level to show the overlay
      var opacity = 1; // Default opacity
  
      // Resize and reposition the div element holding the overlay based on the pixel coordinates
      // Note: The top-left corner of the div should align with the SW point, not the NE point.
      var div = this.div_;
      div.style.left = sw.x + "px";
      div.style.top = ne.y + "px";
      div.style.width = ne.x - sw.x + "px";
      div.style.height = sw.y - ne.y + "px";
  
      var scaleX = (ne.x - sw.x) / this.canvas_.width;
      var scaleY = (sw.y - ne.y) / this.canvas_.height;
      var canvas = div.getElementsByTagName("canvas")[0];
      canvas.style.transform = `scale(${scaleX}, ${scaleY})`;
      canvas.style.transformOrigin = "top left";
  
      if (currentZoom < minZoom || currentZoom > maxZoom) {
        //opacity = 0; // Hide or show the overlay outside the zoom range
      }
  
      this.div_.style.opacity = opacity;
    };
  
    // ---------------------------------------------------
    // On Overlay Remove
    // ---------------------------------------------------
    GeoTIFFOverlay.prototype.onRemove = function () {
      if (this.div_) {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      }
    };
  
    initMas();
  };