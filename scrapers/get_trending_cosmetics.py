from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def get_trending_cosmetics():
    # Set up Safari WebDriver
    driver = webdriver.Safari()

    try:
        # URL of the trending cosmetics page
        url = "https://www.trendyol.com/cok-satanlar?type=bestSeller&webGenderId=1"
        print(f"Opening URL: {url}")
        driver.get(url)

        # Wait for the page to load
        time.sleep(5)

        # Extract product names and URLs
        trending_products = []
        product_cards = driver.find_elements(By.CSS_SELECTOR, "div.p-card-wrppr")
        for product_card in product_cards:
            try:
                product_name = product_card.find_element(By.CSS_SELECTOR, "span.prdct-desc-cntnr-name").text.strip()
                product_url = product_card.find_element(By.CSS_SELECTOR, "a.p-card-chldrn-cntnr").get_attribute("href")
                trending_products.append({"name": product_name, "url": product_url})
            except Exception as e:
                print(f"Error extracting product: {e}")

        return trending_products

    except Exception as e:
        print(f"Error occurred while scraping: {e}")
        return []

    finally:
        # Always quit the WebDriver
        driver.quit()


if __name__ == "__main__":
    # Fetch trending cosmetics
    trending_products = get_trending_cosmetics()

    # Print results
    if trending_products:
        print("\nTrending Cosmetic Products on Trendyol:")
        for idx, product in enumerate(trending_products):
            print(f"{idx + 1}. {product['name']} - {product['url']}")
    else:
        print("No trending products found.")
