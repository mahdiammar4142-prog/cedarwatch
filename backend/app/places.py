LEBANON_PLACES: dict[str, list[str]] = {
    "Akkar": ["Akkar"],
    "Baalbek-Hermel": ["Baalbek", "Hermel"],
    "Beirut": ["Beirut"],
    "Beqaa": ["Zahle", "West Beqaa", "Rashaya"],
    "Mount Lebanon": ["Jbeil", "Keserwan", "Matn", "Baabda", "Aley", "Chouf"],
    "Nabatieh": ["Nabatieh", "Hasbaya", "Marjeyoun", "Bint Jbeil"],
    "North": ["Tripoli", "Miniyeh-Danniyeh", "Zgharta", "Batroun", "Koura", "Bsharri"],
    "South": ["Sidon", "Tyre", "Jezzine"],
}


def governorates() -> list[str]:
    return list(LEBANON_PLACES.keys())


def districts_for(governorate: str) -> list[str]:
    return LEBANON_PLACES.get(governorate, [])


def is_valid_place(governorate: str, district: str) -> bool:
    return district in LEBANON_PLACES.get(governorate, [])
