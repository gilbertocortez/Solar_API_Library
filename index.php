<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="theme-col-lgor" content="#FFE3C8">

    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">

    <meta name="robots" content="noindex">

    <title>Google Solar API by Interactive Utopia</title>

    <!-- CSS Framework -->
    <link rel="stylesheet" href="components/bootstrap/bootstrap.min.css">
    <!-- CSS -->
    <link rel="stylesheet" href="style.css">

    <!-- JavaScript -->
    <!-- Library -->
    <script src="components/gc_solar_api_library/global.js" defer></script>
    <script src="components/gc_solar_api_library/geotiff.js" defer></script>
    <script src="components/gc_solar_api_library/solar_api.js" defer></script>
    <script src="components/gc_solar_api_library/maps.js" defer></script>
    <!-- Frameworks -->
    <script src="components/geotiff/geotiff.js" defer></script>
    <script src="components/proj4/proj4.js" defer></script>
    <script async src="https://maps.googleapis.com/maps/api/js?key={INSERT_API_KEY}&loading=async&callback=onGoogleMapsLoaded&libraries=maps,marker&v=beta" defer></script>


</head>

<body>
    <!-- Page Header -->
    <header class="container">
        <div class="row">
            <div class="col-lg-4">
                <div class="navbar-header">
                    <a class="navbar-brand" href="https://InteractiveUtopia.com" title="Go Home">
                        <img src="/images/logo.jpg" class="mainLogo" alt="Interactive Utopia Logo" />
                    </a>
                </div>
            </div>
            <div class="col-lg d-flex align-items-end justify-content-end">
                <h1 class="header-title text-right">Solar Power Estimate</h1>
            </div>
        </div>
    </header>

    <!-- Google Solar API Address -->
    <div class="row address_container">
        <div class="col-2">
            <label for="property_address_input">Address: </label>
        </div>
        <div class="col">
            <input type="text" name="property_address_input" id="property_address_input">
        </div>
        <div class="col-2">
            <button onclick="getLatLong();">Get Solar Data</button>
        </div>
    </div>

    <!-- Google Maps API Container -->
    <div class="google_map_container">
        <div id="map" class="google_map"></div>
        <div id="canvas_div"></div>
    </div>

    <!-- Google Solar API Controls -->
    <div class="row app_controls">
        <div class="col">
            <div id="overlayControlsSelect">
                <label for="overlaySelect">Select Layer:</label><br />
                <select id="overlaySelect">
                    <option value="0">DSM</option>
                    <option value="1">RGB</option>
                    <option value="2" selected>Annual Flux</option>
                    <option value="3">Monthly Flux</option>
                    <option value="4">Hourly Flux</option>
                </select>
            </div>
        </div>
        <div class="col">
            <label for="monthSelection">Month:</label><label for="monthSlider"><span id="monthName">July</span></label><br />
            <input type="range" id="monthSlider" min="0" max="11" value="6" step="1">
        </div>
        <div class="col">
            <label for="hourSlider">Select Hour: <span id="hourDisplay">12 PM</span></label><br />
            <input type="range" id="hourSlider" min="0" max="23" value="12" step="1">
        </div>
        <div class="col">
            <input type="checkbox" id="toggleAllOverlays" onclick="toggleAllOverlays()" checked> Display <br />Overlay
        </div>
    </div>

    <!-- Google Solar API Bulding Insights -->
    <div class="row">
        <div class="col">
            <h2>Google Solar API Data</h2>
            <div id="gsa_data"></div>
        </div>
        <div class="col">
            <label for="system_modules_watts">Module output (watts):</label><br />
            <input type="number" name="system_modules_watts" id="system_modules_watts" value="395"><br />
            <label for="system_modules_range">Modules:</label><br />
            <input type="range" name="system_modules_range" id="system_modules_range" min="1" max="100">
            <span id="modules_range_display_qty"></span>
        </div>
        <div class="col-1">
            <p>Total Output:<br />
                <span id="modules_calculator_display"></span>
            </p>
        </div>
    </div>

</body>

</html>