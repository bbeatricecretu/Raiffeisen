"""
mock/transactions.py - 250+ transactions
"""
import random
from typing import List, Dict, Any
from .utils import random_date, random_amount

def get_transactions(user_ids: List[str], merchant_names: List[str]) -> List[Dict[str, Any]]:
    """
    Generate 250 transactions distributed geographically (for the dynamic map!!)
    """
    
    # County configuration with weights and cities
    county_config = [
        # (county, cities, weight_percentage)
        ("Bucharest", ["Bucharest", "Bucharest", "Bucharest", "Bucharest", "Bucharest"], 25),
        ("Cluj", ["Cluj-Napoca", "Turda", "Dej", "Gherla", "Florești"], 25),
        ("Iași", ["Iași", "Pașcani", "Hârlău", "Târgu Frumos"], 12),
        ("Timiș", ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia"], 10),
        ("Brașov", ["Brașov", "Făgăraș", "Codlea", "Săcele", "Zărnești"], 8),
        ("Constanța", ["Constanța", "Mangalia", "Medgidia", "Năvodari"], 5),
        ("Dolj", ["Craiova", "Băilești", "Calafat"], 3),
        ("Prahova", ["Ploiești", "Câmpina", "Bușteni"], 3),
        ("Sibiu", ["Sibiu", "Mediaș", "Cisnădie"], 2),
        ("Mureș", ["Târgu Mureș", "Reghin", "Sighișoara"], 2),
        ("Argeș", ["Pitești", "Câmpulung", "Curtea de Argeș"], 1.5),
        ("Bihor", ["Oradea", "Beiuș", "Marghita"], 1.5),
        ("Galați", ["Galați", "Tecuci"], 1),
        ("Bacău", ["Bacău", "Onești", "Moinești"], 1),
    ]
    
    transactions = []
    target_count = 250
    
    # Calculate total weight
    total_weight = sum(item[2] for item in county_config)
    
    # Categories for transaction variety
    categories = ["retail", "food", "gas", "transport", "entertainment", "service"]
    
    for county, cities, weight in county_config:
        num_tx = int(target_count * weight / total_weight)
        
        for _ in range(num_tx):
            user_id = random.choice(user_ids)
            merchant = random.choice(merchant_names)
            amount = random_amount(15.0, 850.0)
            city = random.choice(cities)
            date = random_date(2024, 1, 3)  # Jan-March 2024
            
            # Match merchant type with category
            if "Mega" in merchant or "Lidl" in merchant or "Kaufland" in merchant:
                category = "retail"
            elif "McDonald" in merchant or "Starbucks" in merchant or "Pizza" in merchant:
                category = "food"
            elif "OMV" in merchant or "Petrom" in merchant:
                category = "gas"
            elif "CFR" in merchant or "Uber" in merchant:
                category = "transport"
            elif "Cinema" in merchant or "Patinoar" in merchant:
                category = "entertainment"
            elif "Digi" in merchant or "Orange" in merchant:
                category = "service"
            else:
                category = random.choice(categories)
            
            transaction = {
                "user_id": user_id,
                "merchant_name": merchant,
                "amount": amount,
                "date": date,
                "currency": "RON",
                "city": city,
                "county": county,
                "category": category,
                "raw_pos_string": f"POS {merchant} {city}"
            }
            transactions.append(transaction)
    
    # Add specific transactions for AI analysis features
    ai_transactions = _get_ai_training_transactions(user_ids)
    transactions.extend(ai_transactions)
    
    return transactions

def _get_ai_training_transactions(user_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Create transaction patterns for AI analysis features:
    - Regular spending patterns
    - Unusual transactions (for fraud detection demo)
    - Merchant frequency analysis
    """
    if not user_ids:
        return []
    
    # Will use first user as the "main" user for AI demos
    main_user = user_ids[0]
    
    transactions = []
    
    # exp: Weekly supermarket shopping
    for week in range(1, 13):  # 12 weeks
        transactions.append({
            "user_id": main_user,
            "merchant_name": "Mega Image",
            "amount": random_amount(120.0, 280.0),
            "date": f"2024-01-{week*7 - 3:02d}",
            "currency": "RON",
            "city": "Bucharest",
            "county": "Bucharest",
            "category": "retail",
            "raw_pos_string": "POS Mega Image Bucharest"
        })
    
    # exp:  Monthly bills
    for month in range(1, 4):
        transactions.append({
            "user_id": main_user,
            "merchant_name": "Digi Romania",
            "amount": 65.00,
            "date": f"2024-0{month}-10",
            "currency": "RON",
            "city": "Bucharest",
            "county": "Bucharest",
            "category": "service",
            "raw_pos_string": "POS Digi Romania"
        })
    
    # exp: Daily coffee (workdays)
    for day in range(5, 25, 2):  # Every 2 days
        if random.random() > 0.3:  # 70% chance
            transactions.append({
                "user_id": main_user,
                "merchant_name": "Starbucks",
                "amount": random_amount(15.0, 28.0),
                "date": f"2024-02-{day:02d}",
                "currency": "RON",
                "city": "Bucharest",
                "county": "Bucharest",
                "category": "food",
                "raw_pos_string": "POS Starbucks"
            })
    
    # exp: Weekend travel/entertainment
    weekend_dates = ["2024-01-13", "2024-01-20", "2024-01-27", "2024-02-10", "2024-02-24"]
    for date in weekend_dates:
        transactions.append({
            "user_id": main_user,
            "merchant_name": "CFR Călători",
            "amount": random_amount(75.0, 120.0),
            "date": date,
            "currency": "RON",
            "city": "Bucharest",
            "county": "Bucharest",
            "category": "transport",
            "raw_pos_string": "POS CFR"
        })
        
        # Add destination transactions
        if "13" in date:
            county = "Brașov"
            city = "Brașov"
        elif "20" in date:
            county = "Iași"
            city = "Iași"
        else:
            county = "Cluj"
            city = "Cluj-Napoca"
        
        transactions.append({
            "user_id": main_user,
            "merchant_name": "La Mama",
            "amount": random_amount(85.0, 150.0),
            "date": date,
            "currency": "RON",
            "city": city,
            "county": county,
            "category": "food",
            "raw_pos_string": f"POS La Mama {city}"
        })
    
    #  exp: Gas fill-ups
    for month in range(1, 4):
        for week in range(1, 5):
            transactions.append({
                "user_id": main_user,
                "merchant_name": "OMV Petrom",
                "amount": random_amount(180.0, 320.0),
                "date": f"2024-0{month}-{week*7:02d}",
                "currency": "RON",
                "city": random.choice(["Bucharest", "Ploiești"]),
                "county": random.choice(["Bucharest", "Prahova"]),
                "category": "gas",
                "raw_pos_string": "POS OMV"
            })
    
    return transactions