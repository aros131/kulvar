from pymongo import MongoClient
from datetime import datetime, timezone

def insert_product_data(product_id, platform, product_name, rating, review_count):
    # Connect to your MongoDB cluster
    client = MongoClient("mongodb+srv://arenkaraseki:azxazx3@productreviewcluster.hfgko.mongodb.net/")
    
    # Select the database and collection
    db = client["product_reviews"]  # Replace with your database name
    collection = db["products"]     # Replace with your collection name

    # Create the product data dynamically
    product_data = {
        "metadata": {
            "product_id": product_id,
            "platform": platform,
            "product_name": product_name
        },
        "timestamp": datetime.now(timezone.utc),  # Current time in UTC
        "rating": rating,
        "review_count": review_count
    }

    # Insert the data into the collection
    result = collection.insert_one(product_data)

    # Print the ID of the inserted document
    print(f"Inserted document with ID: {result.inserted_id}")
