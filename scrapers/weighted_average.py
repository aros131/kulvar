def calculate_weighted_average(data):
    total_rating = 0
    total_count = 0

    for entry in data:
        if entry["rating_value"] is not None and entry["rating_count"] > 0:
            total_rating += entry["rating_value"] * entry["rating_count"]
            total_count += entry["rating_count"]

    if total_count > 0:
        return round(total_rating / total_count, 2)
    else:
        return None
