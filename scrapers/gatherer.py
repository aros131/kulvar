from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

def gather_urls(product_name):
    # Initialize WebDriver (ensure Safari or your chosen driver is correctly set up)
    driver = webdriver.Safari()

    urls = {
        "trendyol": None,
    }

    try:
        # Search for Trendyol
        print(f"Searching Google for: {product_name} site:trendyol.com")
        driver.get("https://www.google.com/")
        search_box = driver.find_element(By.NAME, "q")
        search_box.send_keys(f"{product_name} site:trendyol.com")
        search_box.send_keys(Keys.RETURN)
        time.sleep(2)

        # Extract the first Trendyol URL
        trendyol_result = driver.find_element(By.CSS_SELECTOR, "div.yuRUbf a")
        urls["trendyol"] = trendyol_result.get_attribute("href")
        print(f"Found Trendyol URL: {urls['trendyol']}")

    except Exception as e:
        print(f"Error finding URLs: {e}")

    finally:
        driver.quit()

    return urls

if __name__ == "__main__":
    # Ask the user for a product name
    product_name = input("Enter the product name to search: ")

    # Gather URLs
    urls = gather_urls(product_name)

    # Display gathered URLs
    print("\nGathered URLs:")
    for platform, url in urls.items():
        if url:
            print(f"{platform.capitalize()}: {url}")
        else:
            print(f"{platform.capitalize()}: No URL found.")

