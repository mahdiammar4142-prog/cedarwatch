from math import asin, cos, radians, sin, sqrt

CLUSTER_RADIUS_KM = 2.0

LEBANON_BOUNDS = {
    "south": 33.05,
    "north": 34.69,
    "west": 35.1,
    "east": 36.62,
}

LEBANON_CENTER = {"latitude": 33.8547, "longitude": 35.8623}


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))


def is_in_lebanon(lat: float, lon: float) -> bool:
    return (
        LEBANON_BOUNDS["south"] <= lat <= LEBANON_BOUNDS["north"]
        and LEBANON_BOUNDS["west"] <= lon <= LEBANON_BOUNDS["east"]
    )
