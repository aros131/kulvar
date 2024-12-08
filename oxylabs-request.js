const https = require("https");

// Your Oxylabs credentials
const username = "arenkaaaaaa_d3nlv"; // Replace with your username
const password = "Azxazx23_456"; // Replace with your password

// The body of the request (query data)
const body = {
  source: "amazon_product",  // Data source (Amazon product)
  query: "B07FZ8S74R",       // The Amazon product ID
  geo_location: "90210",     // Optional: Location for localized results
  parse: true,               // Request to parse the data
};

// Request options
const options = {
  hostname: "realtime.oxylabs.io",  // Oxylabs API hostname
  path: "/v1/queries",              // API endpoint
  method: "POST",                   // HTTP method
  headers: {
    "Content-Type": "application/json",  // JSON content type
    Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"), // Basic Auth
  },
};

// Make the HTTPS request
const request = https.request(options, (response) => {
  let data = "";

  // Collect data from the response
  response.on("data", (chunk) => {
    data += chunk;
  });

  // When the response ends, parse and log the result
  response.on("end", () => {
    try {
      const responseData = JSON.parse(data);
      console.log(JSON.stringify(responseData, null, 2)); // Pretty-print the JSON response
    } catch (error) {
      console.error("Error parsing JSON response:", error);
    }
  });
});

// Handle request errors
request.on("error", (error) => {
  console.error("Error:", error);
});

// Write the request body and send the request
request.write(JSON.stringify(body));
request.end();
