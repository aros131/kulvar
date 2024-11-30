import requests
from bs4 import BeautifulSoup
import json

def scrape_trendyol(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the JSON-LD script tag
        json_script = soup.find('script', type='application/ld+json')
        if json_script:
            json_data = json.loads(json_script.string)

            # Extract data from the JSON-LD
            product_name = json_data.get("name", "Unknown Product")
            aggregate_rating = json_data.get("aggregateRating", {})

            # Extract and print product details
            rating_value = aggregate_rating.get("ratingValue", "No Rating")
            rating_count = aggregate_rating.get("ratingCount", 0)
            print(f"Product Name: {product_name}")
            print(f"Rating: {rating_value} ({rating_count} ratings)")

            return rating_value, rating_count
        else:
            print("No JSON-LD data found!")
            return 0, 0
    else:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")
        return 0, 0

if __name__ == "__main__":
    # Test the function with a product URL
    test_url = "https://www.trendyol.com/your-product-url"
    scrape_trendyol(test_url)
