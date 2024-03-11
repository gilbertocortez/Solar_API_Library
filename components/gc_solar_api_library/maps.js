// --------------------------------------------------------------------------------------------------------------------------------------------
//
//  Developed by:
//    Gilberto Cortez
//
//  Website:
//    InteractiveUtopia.com
//
//  Description:
//    - Functions to work with Google Maps JavaScript API
//
// --------------------------------------------------------------------------------------------------------------------------------------------
// Google Maps API Call
// Get latitude and longitude from address
// --------------------------------------------------------------------------------------------------------------------------------------------
function getLatLong() {
  address = addressInputElement.value;
  console.log(address);

  // Replace spaces with plus (+) for URL compatibility
  const formattedAddress = address.split(" ").join("+");

  // Form the request URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${apiKey}`;

  // Make the fetch request
  fetch(url)
    .then((response) => response.json()) // Convert response to JSON
    .then((data) => {
      if (data.status === "OK") {
        // Extract latitude and longitude
        latitude = data.results[0].geometry.location.lat;
        longitude = data.results[0].geometry.location.lng;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        // Clear existing overlays
        overlays.forEach((overlay) => overlay.setMap(null));
        overlays = []; // Reset the overlays array
        // Re initiate map and requests
        initMas();
      } else {
        console.log("Geocoding failed: " + data.status);
        console.log(data);
      }
    })
    .catch((error) => console.error("Error:", error));
}

// --------------------------------------------------------------------------------------------------------------------------------------------
// Google Map Initiation Function
// --------------------------------------------------------------------------------------------------------------------------------------------

var initMas = async () => {
  // Function to update the month name based on the slider's value
  function updateMonth() {
    monthNameDisplay.textContent = monthNames[selectedMonthElement.value];
  }

  // Function to update the hour display based on the slider's value
  function updateHour() {
    hourDisplay.textContent = hourNames[selectedHourElement.value];
  }

  // Add event listeners
  selectedMonthElement.addEventListener("input", updateMonth);
  selectedHourElement.addEventListener("input", updateHour);

  // Initialize the display
  updateMonth();
  updateHour();

  const selectedMonth = parseInt(selectedMonthElement.value, 10);
  const myLatLng = new google.maps.LatLng(latitude, longitude);
  var mapOptions = {
    zoom: 19,
    center: myLatLng,
    mapTypeId: "satellite",
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const url = new URL("https://solar.googleapis.com/v1/dataLayers:get");

  // Define UTM Zone 11N projection string (you can find the correct string for other zones or systems online)
  var utmZone11N =
    "+proj=utm +zone=11 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

  // Add map query initiation parameters
  url.searchParams.append("location.latitude", latitude);
  url.searchParams.append("location.longitude", longitude);
  url.searchParams.append("radiusMeters", "100");
  url.searchParams.append("view", "FULL_LAYERS");
  url.searchParams.append("requiredQuality", "HIGH");
  url.searchParams.append("pixelSizeMeters", "0.5");
  url.searchParams.append("key", apiKey);
  fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(async (data) => {
      solar_data_layers = data;

      solar_layers = [
        solar_data_layers.dsmUrl,
        solar_data_layers.rgbUrl,
        solar_data_layers.annualFluxUrl,
        solar_data_layers.monthlyFluxUrl,
        solar_data_layers.hourlyShadeUrls,
      ];

      // Load and apply mask first
      let maskUrl = new URL(solar_data_layers.maskUrl);
      if (maskUrl) {
        maskUrl.searchParams.append("key", apiKey);
        let maskResponse = await loadAndRenderGeoTIFF(maskUrl, true);
        maskCanvas = maskResponse.canvas;
      }
      // ---------------------------------------------------------------------------------------------------------------------------------------

      try {
        const selectedLayer = parseInt(selectedOverlayElement.value, 10);

        let geotiff_url;
        if (layer_type[selectedLayer] === "hourlyShade") {
          geotiff_url = new URL(solar_layers[selectedLayer][selectedMonth]);
        } else {
          geotiff_url = new URL(solar_layers[selectedLayer]);
        }
        geotiff_url.searchParams.append("key", apiKey);
        const isMask =
          solar_layers[selectedLayer] === solar_data_layers.maskUrl;
        const month =
          layer_type[selectedLayer] === "monthlyFlux" ? selectedMonth : null;

        const canvas_result = await loadAndRenderGeoTIFF(
          geotiff_url,
          isMask,
          layer_type[selectedLayer],
          selectedMonth
        );

        const canvas = canvas_result.canvas;

        if (!isMask && maskCanvas) {
          applyMaskToOverlay(canvas, maskCanvas);
        }
        // Convert each corner of the bounding box
        var sw = proj4(utmZone11N, "EPSG:4326", [
          canvas_result.bbox[0],
          canvas_result.bbox[1],
        ]);
        var ne = proj4(utmZone11N, "EPSG:4326", [
          canvas_result.bbox[2],
          canvas_result.bbox[3],
        ]);

        const overlayBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(sw[1], sw[0]), // South West corner
          new google.maps.LatLng(ne[1], ne[0]) // North East corner
        );

        const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
        overlays.push(overlay);
      } catch (error) {
        console.error("Error loading GeoTIFF:", error);
      }
    })
    .catch((error) => {
      console.error("Fetch gapi error:", error);
    });

  // Property Data Solar API
  (async () => {
    var solar_data = await findClosestBuildingInsights(
      latitude,
      longitude,
      apiKey
    );
    // Get Data
    let maxModules = solar_data.solarPotential.maxArrayPanelsCount;
    let maxSunshineHoursPerYear = Math.round(
      solar_data.solarPotential.maxSunshineHoursPerYear
    );
    let wholeRoofSize = Number(
      solar_data.solarPotential.wholeRoofStats.areaMeters2.toFixed(2)
    );

    const element_modules_range = document.getElementById(
      "system_modules_range"
    );
    const element_modules_range_watts = document.getElementById(
      "system_modules_watts"
    );
    const element_modules_calculator_display = document.getElementById(
      "modules_calculator_display"
    );

    // Now we can safely call these functions
    changeMaxValue(element_modules_range, maxModules);
    calculate_output(
      element_modules_range,
      element_modules_range_watts,
      element_modules_calculator_display
    );

    let gsa_data = document.getElementById("gsa_data");
    gsa_data.innerHTML = "Max Module Count: " + maxModules + " modules";
    gsa_data.innerHTML +=
      "<br/> Max Annual Sunshine: " + maxSunshineHoursPerYear + " hr";
    gsa_data.innerHTML +=
      "<br/> Roof Area: " + wholeRoofSize + " m<sup>2</sup>";
  })();
  map.setTilt(0);

  // ---------------------------------------------------------------------------------------------------------------------------------------
  // Event listener for Month Change Control
  // ---------------------------------------------------------------------------------------------------------------------------------------

  function changeMonthLayer() {
    const selectedMonth = parseInt(this.value, 10); // Get the selected month as an integer
    const monthlyFluxUrl = solar_data_layers.monthlyFluxUrl;
    if (monthlyFluxUrl) {
      // Clear existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = []; // Reset the overlays array
      // Reload the GeoTIFF layer for the selected month
      let geotiff_url = new URL(monthlyFluxUrl);
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url.toString(),
        false,
        "monthlyFlux",
        selectedMonth
      )
        .then((canvas_result) => {
          if (canvas_result) {
            selectedOverlayElement.value = 3;
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }
            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            // Convert each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]), // South West corner
              new google.maps.LatLng(ne[1], ne[0]) // North East corner
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  // --------------------------------------------------------------------------------------------------------------------------------------------
  // Event listener for hour selection
  // --------------------------------------------------------------------------------------------------------------------------------------------

  function changeHourLayer() {
    // Change the event listener to 'change' to update the hour display when the user finishes sliding
    const selectedMonth = parseInt(selectedMonthElement.value, 10);
    const selectedHour = parseInt(this.value, 10);
    const hourlyShadeUrls = solar_data_layers.hourlyShadeUrls[selectedMonth];

    if (hourlyShadeUrls) {
      // Clear existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];

      // Reload the GeoTIFF layer for the selected hour
      let geotiff_url = new URL(hourlyShadeUrls);
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url,
        false,
        "hourlyShade",
        selectedMonth,
        null,
        selectedHour
      )
        .then((canvas_result) => {
          if (canvas_result) {
            selectedOverlayElement.value = 4;
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }
            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            // Convert each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]), // South West corner
              new google.maps.LatLng(ne[1], ne[0]) // North East corner
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  // --------------------------------------------------------------------------------------------------------------------------------------------
  // Event listener for layer selection
  // --------------------------------------------------------------------------------------------------------------------------------------------
  function changeTypeLayer() {
    const selectedMonth = parseInt(selectedMonthElement.value, 10);
    const selectedHour = parseInt(selectedHourElement.value, 10);
    const selectedLayer = parseInt(this.value, 10);

    const data_layer_url = solar_layers[parseInt(selectedLayer)];

    if (data_layer_url) {
      // Clear existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];

      // Reload the GeoTIFF layer for the selected hour
      let geotiff_url;

      if (layer_type[selectedLayer] === "hourlyShade") {
        geotiff_url = new URL(data_layer_url[selectedMonth]);
      } else {
        geotiff_url = new URL(data_layer_url);
      }
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url.toString(),
        false,
        layer_type[selectedLayer],
        selectedMonth,
        null,
        selectedHour
      )
        .then((canvas_result) => {
          if (canvas_result) {
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }

            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            // Convert each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]), // South West corner
              new google.maps.LatLng(ne[1], ne[0]) // North East corner
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  if (!listenersAdded) {
    selectedMonthElement.addEventListener("change", changeMonthLayer);
    selectedHourElement.addEventListener("change", changeHourLayer);
    selectedOverlayElement.addEventListener("change", changeTypeLayer);
    listenersAdded = true; // Set the flag so listeners aren't added again
  }
};


