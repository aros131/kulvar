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
            name: product.title,               // Keeping English field name
            brand: translateToTurkish(product.brand),     // Translated value
            category: translateToTurkish(product.category), // Translated value
            rating: translateToTurkish(product.rating),    // Translated value
            image: product.image_url           // Keeping English field name
          };

          // Append product data to products.json
          saveProductDataToFile(productDetails);
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

// Function to translate values to Turkish
function translateToTurkish(value) {
  const translations = {
    "Apple": "Apple",                 // Leave product names like "Apple" in English
    "Samsung": "Samsung",             // Leave product names like "Samsung" in English
    "Smartphones": "Akıllı Telefonlar", // Example translation
    "4.5": "4.5",                    // Rating remains the same
    // Add more translations for different categories, brands, etc. as needed
  };

  return translations[value] || value; // Default to the original value if no translation exists
}

// Function to save product data to products.json
function saveProductDataToFile(productDetails) {
  const filePath = "products.json";
  // Read the existing data from the file, or create an empty array if the file doesn't exist
  const fileData = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];
  fileData.push(productDetails);
  // Write the updated data back to the file
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
  console.log(`Ürün verisi kaydedildi: ${productDetails.name}`);
}

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
