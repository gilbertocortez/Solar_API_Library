// --------------------------------------------------------------------------------------------------------------------------------------------
//
//  Developed by:
//    Gilberto Cortez
//
//  Website:
//    InteractiveUtopia.com
//
//  Technologies Used:
//    - Google Maps JavaScript API
//    - GeoTiff.js / https://geotiffjs.github.io/
//    - proj4.js / http://proj4js.org/
//
// --------------------------------------------------------------------------------------------------------------------------------------------
// Global Variables
const apiKey = "{INSERT_API_KEY}"; // Replace with your actual API key {INSERT_API_KEY}

// Latitude: 32.6579371, Longitude: -117.0210882
var address;
var latitude = 32.7720012;
var longitude = -117.0726966;
var solar_data;
var overlays = [];
var map;
var solar_layers;

// Colors
const binaryPalette = ["212121", "B3E5FC"];
const rainbowPalette = ["3949AB", "81D4FA", "66BB6A", "FFE082", "E53935"];
const ironPalette = ["00000A", "91009C", "E64616", "FEB400", "FFFFF6"];
const sunlightPalette = ["212121", "FFCA28"];

// GeoTiff Data Layers
const dataLayerOptions = [
  { id: "none", name: "No layer" },
  { id: "mask", name: "Roof mask" },
  { id: "dsm", name: "Digital Surface Model" }, // rainbowPalette
  { id: "rgb", name: "Aerial image" }, // ironPalette
  { id: "annualFlux", name: "Annual sunshine" }, // ironPalette
  { id: "monthlyFlux", name: "Monthly sunshine" }, // ironPalette
  { id: "hourlyShade", name: "Hourly shade" }, // sunlightPalette
];

// Layer types
const layer_type = ["dsm", "rgb", "annualFlux", "monthlyFlux", "hourlyShade"];
var listenersAdded = false;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const hourNames = [
  "12 AM",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
];

// DOM Objects
const selectedOverlayElement = document.getElementById("overlaySelect");
const selectedMonthElement = document.getElementById("monthSlider");
const selectedHourElement = document.getElementById("hourSlider");
const checkboxDisplayOverlays = document.getElementById("toggleAllOverlays");
const monthNameDisplay = document.getElementById("monthName");
const hourDisplay = document.getElementById("hourDisplay");
const addressInputElement = document.getElementById("property_address_input");
const element_modules_range = document.getElementById("system_modules_range");
const element_modules_range_display = document.getElementById(
  "modules_range_display_qty"
);
const element_modules_range_watts = document.getElementById(
  "system_modules_watts"
);
const element_modules_calculator_display = document.getElementById(
  "modules_calculator_display"
);