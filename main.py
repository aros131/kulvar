from gatherer import gather_urls
from scrape_trendyol import scrape_trendyol
from insert_data import insert_product_data  # Import the data insertion function

def main():
    # Ask the user for a product name
    product_name = input("Enter the product name to search: ")

    # Gather URLs
    urls = gather_urls(product_name)

    # Scrape data from Trendyol
    if urls["trendyol"]:
        print(f"\nScraping Trendyol...")
        trendyol_data = scrape_trendyol(urls["trendyol"])  # This returns a tuple

        # Check if data is valid
        if trendyol_data:
            rating, rating_count = trendyol_data  # Unpack the tuple
            print(f"Trendyol Rating: {rating} ({rating_count} reviews)")

            # Insert the scraped data into MongoDB dynamically
            insert_product_data(
                product_id="N/A",  # Set this to a unique identifier if available
                platform="Trendyol",
                product_name=product_name,
                rating=rating,
                review_count=rating_count
            )
        else:
            print("Failed to scrape data from Trendyol.")
    else:
        print("No Trendyol URL found.")

    # Calculate Weighted Average (Currently only one source)
    if 'trendyol_data' in locals() and trendyol_data:
        weighted_average = float(rating)
        print(f"\nWeighted Average Rating: {weighted_average:.2f} ({rating_count} total reviews)")
    else:
        print("\nNo data available to calculate weighted average.")

if __name__ == "__main__":
    main()

