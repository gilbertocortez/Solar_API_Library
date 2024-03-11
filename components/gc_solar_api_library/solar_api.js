// --------------------------------------------------------------------------------------------------------------------------------------------
//
//  Developed by:
//    Gilberto Cortez
//
//  Website:
//    InteractiveUtopia.com
//
//  Description:
//    - Functions to work with Google Solar API
//
// --------------------------------------------------------------------------------------------------------------------------------------------
// Get data from latitude and longitude
async function findClosestBuildingInsights(latitude, longitude, apiKey) {
  // Form the request URL
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key=${apiKey}`;

  try {
    // Make the fetch request and wait for the response
    const response = await fetch(url);

    // Convert response to JSON and return
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Update max value on range selector for # of modules
function changeMaxValue(element, new_max) {
  if (element && element.value > new_max) {
    element.value = new_max;
    element_modules_range_display.innerHTML = new_max;
  }
  element.max = new_max;
  console.log("Max value changed to", new_max);
}

// Update value on range display span
function updateRange(rangeElement, displayElement) {
  displayElement.innerHTML = rangeElement.value;
}

// --------------------------------------------------------------------------------------------------------------------------------------------
// Total output calculation from # of modules * output watts
// --------------------------------------------------------------------------------------------------------------------------------------------
function calculate_output(rangeElement, wattsElement, displayElement) {
  // Calculate the total output in watts
  var totalWatts = Number(rangeElement.value) * Number(wattsElement.value);

  // Convert watts to kilowatts and round to two decimal places
  var totalKilowatts = (totalWatts / 1000).toFixed(2);

  // Update the display element with the formatted result
  displayElement.innerHTML = totalKilowatts + " kW";
}

// --------------------------------------------------------------------------------------------------------------------------------------------
// Add event listeners
// --------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", (event) => {
  changeMaxValue(element_modules_range, 100);
  updateRange(element_modules_range, element_modules_range_display);
  // Add an event listener for the range input
  element_modules_range.addEventListener("input", () => {
    updateRange(element_modules_range, element_modules_range_display);
  });
  element_modules_range.addEventListener("change", () => {
    calculate_output(
      element_modules_range,
      element_modules_range_watts,
      element_modules_calculator_display
    );
  });
});
