import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Returns distance in kilometers between two coordinates.
    No external API used.
    """
    R = 6371  # Earth radius in KM

    lat1, lon1, lat2, lon2 = map(math.radians, [
        float(lat1), float(lon1), float(lat2), float(lon2)
    ])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.asin(math.sqrt(a))
    return R * c
