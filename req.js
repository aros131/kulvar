const https = require("https");
const fs = require("fs");

// Your Oxylabs credentials
const username = "arenkaaaaaa_d3nlv";  // Replace with your Oxylabs username
const password = "Azxazx23_456";      // Replace with your Oxylabs password

// Function to extract the ASIN from an Amazon URL
function extractASIN(url) {
  const regex = /(?:dp|gp\/product)\/([A-Z0-9]{10})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to fetch product data from Oxylabs API
const fetchProductData = (asin) => {
  const body = {
    source: "amazon_product",
    query: asin,
    geo_location: "90210",  // Optional, use if you want to set a specific location
    parse: true,
  };

  const options = {
    hostname: "realtime.oxylabs.io",
    path: "/v1/queries",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
    },
  };

  const request = https.request(options, (response) => {
    let data = "";
    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      try {
        const responseData = JSON.parse(data);
        if (responseData.data) {
          const product = responseData.data;
          const productDetails = {
            name: product.title,
            brand: product.brand,
            category: product.category,
            rating: product.rating,
            image: product.image_url
          };
          console.log(`Data for ASIN ${asin}:`, JSON.stringify(productDetails, null, 2));
        } else {
          console.log(`No data found for ASIN ${asin}`);
        }
      } catch (error) {
        console.error("Error parsing response:", error);
      }
    });
  });

  request.on("error", (error) => {
    console.error("Error:", error);
  });

  request.write(JSON.stringify(body));
  request.end();
};

// Main function to process the Amazon URL(s) from command-line arguments
const processAmazonURLs = (urls) => {
  if (urls.length === 0) {
    console.error("No Amazon URLs provided.");
    return;
  }

  urls.forEach((url) => {
    const asin = extractASIN(url);
    if (asin) {
      console.log(`Extracted ASIN: ${asin}`);
      fetchProductData(asin);
    } else {
      console.error(`Invalid Amazon URL or ASIN not found: ${url}`);
    }
  });
};

// Get Amazon URLs from command-line arguments (skipping the first argument which is the script name)
const amazonURLs = process.argv.slice(2);

processAmazonURLs(amazonURLs);
