"""
seed_rich.py
============
Demo data for the Raiffeisen Smart AI database.
Written by Person 3 (Database).

Populates the database with 3 realistic student profiles covering
January 2024 through February 2026. Each profile has a distinct
financial situation that changes over time, demonstrating the
income source history feature.

Run once from backend/ to populate raiffeisen.db:
    python src/database/seed_rich.py

Re-running is safe — existing users are detected and skipped.
To start fresh, delete raiffeisen.db first:
    rm raiffeisen.db && python src/database/seed_rich.py

WHAT GETS INSERTED
------------------
Users:              3
Merchants:         33
Transactions:     584  (Jan 2024 - Feb 2026)
Income sources:     8  (with start/end dates reflecting real-life changes)
Monthly snapshots: 78  (income vs spending vs saved, per user per month)

STUDENT PROFILES
----------------
Alex Popescu (alex.popescu@student.ubbcluj.ro)
    UBB Cluj, year 2. Scholarship 600 RON + barista job 1200 RON/month.
    Loses scholarship in July 2024 (dropped grades), keeps the job at 1200 RON.
    Gets a paid internship at Cegeka in October 2025 — income jumps to 3700 RON.
    Spending pattern: Lidl/Penny for groceries, Glovo 2x/month, CTP pass,
    Netflix, rare Uber.

Maria Ionescu (maria.ionescu@student.ubbcluj.ro)
    UBB Cluj, year 1. Parents send 2000 RON/month throughout.
    Gets a part-time job at Zara in May 2025 — income rises to 2900 RON.
    Spending pattern: Kaufland weekly, Zara/H&M monthly, Tazz/Glovo often,
    Uber instead of public transport, Digi, Spotify, Netflix, Cinema City, Fever.

Radu Moldovan (radu.moldovan@student.utcluj.ro)
    UTC Cluj, year 4. Social scholarship 300 RON + Bosch internship 3500 RON in 2024.
    Hired full-time at Bosch from January 2025 at 5500 RON/month.
    Spending pattern: OMV 3x/month (owns a car), large eMag purchases,
    Steam, Enel and Digi monthly, Kaufland with bigger baskets.
"""

import sys
from pathlib import Path
from datetime import datetime, date

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from src.database.database_client import DatabaseClient


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def T(email, merchant, amount, dt, pos, loc="Cluj-Napoca", cat="other"):
    return {"user_email": email, "merchant_name": merchant, "amount": amount,
            "date": dt, "raw_pos_string": pos, "location": loc, "category": cat}

CITY_TO_COUNTY = {
    "Cluj-Napoca": "CJ", "Cluj": "CJ", "Online": "CJ",
    "Bucharest": "B", "București": "B",
    "Timișoara": "TM", "Timisoara": "TM",
    "Iași": "IS", "Iasi": "IS",
    "Brașov": "BV", "Brasov": "BV",
    "Constanța": "CT", "Constanta": "CT",
    "Craiova": "DJ", "Oradea": "BH", "Sibiu": "SB",
}

A = "alex.popescu@student.ubbcluj.ro"
M = "maria.ionescu@student.ubbcluj.ro"
R = "radu.moldovan@student.utcluj.ro"


# ──────────────────────────────────────────────────────────────────────────────
# USERS
# ──────────────────────────────────────────────────────────────────────────────

USERS = [
    {"name": "Alex Popescu",  "email": A, "university": "UBB Cluj",  "study_year": 2},
    {"name": "Maria Ionescu", "email": M, "university": "UBB Cluj",  "study_year": 1},
    {"name": "Radu Moldovan", "email": R, "university": "UTC Cluj",  "study_year": 4},
]

# ──────────────────────────────────────────────────────────────────────────────
# INCOME SOURCE HISTORY per user
# Each entry: (source_type, amount, started_at, ended_at, employer, notes)
# ended_at = None means still active
# ──────────────────────────────────────────────────────────────────────────────

INCOME_HISTORY = {
    A: [
        # Bursă de merit sem1 2024 (oct 2023 – ian 2024, dar o vedem din ian)
        ("bursa_merit",    600,  "2024-01-01", "2024-06-30", "UBB Cluj",
         "Bursă de performanță semestrul 1 an 2"),
        # Job part-time barista – toată perioada
        ("job_part_time", 1200, "2024-01-01", None,          "Starbucks Cluj",
         "Barista 4 ore/zi, luni-vineri"),
        # Bursă pierdută în sem2 2024 (medie scăzută)
        # — nu mai apare pentru sem2 2024
        # Internship plătit – oct 2025 (an 3, sem1)
        ("internship",    2500, "2025-10-01", None,          "Cegeka Cluj",
         "Internship development Python, 6 luni"),
    ],
    M: [
        # Ajutor părinți tot timpul
        ("ajutor_parinti", 2000, "2024-01-01", None,         "",
         "Transfer lunar de la părinți"),
        # Job part-time luat în mai 2025
        ("job_part_time",  900, "2025-05-01", None,          "Zara Cluj Iulius",
         "Vânzătoare part-time, weekenduri"),
    ],
    R: [
        # Bursă socială
        ("bursa_sociala",  300, "2024-01-01", "2024-06-30",  "UTC Cluj",
         "Bursă socială an 4 sem1"),
        # Internship Bosch tot 2024
        ("internship",    3500, "2024-01-01", "2024-12-31",  "Bosch Cluj",
         "Internship embedded systems, 12 luni"),
        # Angajat full-time la Bosch din ian 2025
        ("job_part_time", 5500, "2025-01-01", None,          "Bosch Cluj",
         "Junior engineer full-time după finalizarea internship-ului"),
    ],
}

# ──────────────────────────────────────────────────────────────────────────────
# MERCHANTS
# ──────────────────────────────────────────────────────────────────────────────

MERCHANTS = [
    {"canonical_name": "Kaufland",            "merchant_type": "retail",        "confidence": 0.97},
    {"canonical_name": "Mega Image",          "merchant_type": "retail",        "confidence": 0.95},
    {"canonical_name": "Lidl",                "merchant_type": "retail",        "confidence": 0.97},
    {"canonical_name": "Carrefour",           "merchant_type": "retail",        "confidence": 0.96},
    {"canonical_name": "Penny",               "merchant_type": "retail",        "confidence": 0.94},
    {"canonical_name": "eMag",                "merchant_type": "retail",        "confidence": 0.98},
    {"canonical_name": "H&M",                 "merchant_type": "retail",        "confidence": 0.96},
    {"canonical_name": "Zara",                "merchant_type": "retail",        "confidence": 0.95},
    {"canonical_name": "Starbucks",           "merchant_type": "food",          "confidence": 0.99},
    {"canonical_name": "McDonald's",          "merchant_type": "food",          "confidence": 0.99},
    {"canonical_name": "KFC",                 "merchant_type": "food",          "confidence": 0.99},
    {"canonical_name": "Glovo",               "merchant_type": "food",          "confidence": 0.96},
    {"canonical_name": "Tazz",                "merchant_type": "food",          "confidence": 0.95},
    {"canonical_name": "Vivo Pizza",          "merchant_type": "food",          "confidence": 0.90},
    {"canonical_name": "Dristor Kebab",       "merchant_type": "food",          "confidence": 0.88},
    {"canonical_name": "Căpșuna Café",        "merchant_type": "food",          "confidence": 0.85},
    {"canonical_name": "Rompetrol",           "merchant_type": "gas",           "confidence": 0.95},
    {"canonical_name": "OMV",                 "merchant_type": "gas",           "confidence": 0.96},
    {"canonical_name": "Uber",                "merchant_type": "transport",     "confidence": 0.98},
    {"canonical_name": "Bolt",                "merchant_type": "transport",     "confidence": 0.97},
    {"canonical_name": "CFR Călători",        "merchant_type": "transport",     "confidence": 0.93},
    {"canonical_name": "CTP Cluj",            "merchant_type": "transport",     "confidence": 0.91},
    {"canonical_name": "Netflix",             "merchant_type": "entertainment", "confidence": 0.99},
    {"canonical_name": "Spotify",             "merchant_type": "entertainment", "confidence": 0.99},
    {"canonical_name": "Steam",               "merchant_type": "entertainment", "confidence": 0.97},
    {"canonical_name": "Cinema City",         "merchant_type": "entertainment", "confidence": 0.96},
    {"canonical_name": "Fever",               "merchant_type": "entertainment", "confidence": 0.88},
    {"canonical_name": "Enel",                "merchant_type": "service",       "confidence": 0.95},
    {"canonical_name": "Digi",                "merchant_type": "service",       "confidence": 0.96},
    {"canonical_name": "Farmacia Tei",        "merchant_type": "service",       "confidence": 0.93},
    {"canonical_name": "Dr. Max",             "merchant_type": "service",       "confidence": 0.92},
    {"canonical_name": "Elefant.ro",          "merchant_type": "education",     "confidence": 0.91},
    {"canonical_name": "Librăria Cărturești", "merchant_type": "education",     "confidence": 0.94},
    {"canonical_name": "Udemy",               "merchant_type": "education",     "confidence": 0.97},
]

# ──────────────────────────────────────────────────────────────────────────────
# TRANSACTIONS  (ian 2024 – feb 2026)
# ──────────────────────────────────────────────────────────────────────────────

TRANSACTIONS = [

    # ══════════════════════════════════════════════════════════════════════
    # ALEX POPESCU — buget strâns, Lidl/Penny > Kaufland, CTP, rar Uber
    # 2024: bursă 600 + job 1200 = 1800 RON/lună
    # jul–dec 2024: fără bursă, doar job 1200 RON/lună
    # 2025: job 1200 + internship 2500 = 3700 RON/lună (din oct 2025)
    # ══════════════════════════════════════════════════════════════════════

    # ── 2024 Ianuarie ───────────────────────────────────────────────────
    T(A,"Lidl",          43.20,"2024-01-03T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"CTP Cluj",       5.00,"2024-01-05T08:10:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Starbucks",     18.00,"2024-01-08T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Netflix",       29.99,"2024-01-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Penny",         38.50,"2024-01-14T17:20:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Glovo",         42.00,"2024-01-19T20:30:00","GLOVO*ORDER 1121",              cat="food"),
    T(A,"McDonald's",    23.50,"2024-01-22T13:00:00","MCDONALDS CLUJ IULIUS",         cat="food"),
    T(A,"Lidl",          51.30,"2024-01-27T11:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Farmacia Tei",  34.80,"2024-01-29T16:00:00","FARMACIA TEI CLUJ",             cat="service"),

    # ── 2024 Februarie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-02-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Penny",         29.90,"2024-02-05T18:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Starbucks",     16.50,"2024-02-09T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Netflix",       29.99,"2024-02-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Librăria Cărturești",67.00,"2024-02-14T14:00:00","CARTURESTI CLUJ",          cat="education"),
    T(A,"Glovo",         38.00,"2024-02-17T21:00:00","GLOVO*ORDER 2234",              cat="food"),
    T(A,"Lidl",          44.10,"2024-02-22T17:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"KFC",           31.00,"2024-02-25T14:30:00","KFC CLUJ IULIUS",               cat="food"),

    # ── 2024 Martie ─────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-03-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Lidl",          48.70,"2024-03-04T18:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     19.00,"2024-03-07T09:15:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Netflix",       29.99,"2024-03-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Elefant.ro",    89.00,"2024-03-12T20:00:00","ELEFANT.RO ONLINE",   loc="Online", cat="education"),
    T(A,"Penny",         35.60,"2024-03-16T17:00:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Glovo",         44.50,"2024-03-21T20:00:00","GLOVO*ORDER 3345",              cat="food"),
    T(A,"McDonald's",    19.00,"2024-03-26T13:30:00","MCDONALDS CLUJ IULIUS",         cat="food"),
    T(A,"Uber",          14.50,"2024-03-28T23:30:00","UBER* TRIP RO",                 cat="transport"),

    # ── 2024 Aprilie ────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-04-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Lidl",          52.40,"2024-04-03T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Netflix",       29.99,"2024-04-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Starbucks",     21.00,"2024-04-11T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"CFR Călători",  89.00,"2024-04-14T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Glovo",         37.00,"2024-04-18T21:30:00","GLOVO*ORDER 4456",              cat="food"),
    T(A,"Penny",         41.20,"2024-04-23T17:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Cinema City",   36.00,"2024-04-27T19:00:00","CINEMA CITY IULIUS",            cat="entertainment"),

    # ── 2024 Mai ────────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-05-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Lidl",          39.80,"2024-05-06T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     17.50,"2024-05-09T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Netflix",       29.99,"2024-05-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Tazz",          51.00,"2024-05-15T20:00:00","TAZZ*ORDER 5123",               cat="food"),
    T(A,"Penny",         28.70,"2024-05-20T18:00:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"KFC",           24.00,"2024-05-24T14:00:00","KFC CLUJ IULIUS",               cat="food"),
    T(A,"Uber",          12.00,"2024-05-31T23:00:00","UBER* TRIP RO",                 cat="transport"),

    # ── 2024 Iunie ──────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-06-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       29.99,"2024-06-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          45.60,"2024-06-08T17:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     22.00,"2024-06-12T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         48.00,"2024-06-17T21:00:00","GLOVO*ORDER 6234",              cat="food"),
    T(A,"CFR Călători", 112.00,"2024-06-20T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Penny",         33.40,"2024-06-25T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2024 Iulie (fără bursă de la sem2) — tăieri ─────────────────────
    T(A,"Netflix",       29.99,"2024-07-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Kaufland",      65.30,"2024-07-05T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Penny",         38.10,"2024-07-09T17:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Starbucks",     14.00,"2024-07-12T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         35.00,"2024-07-19T20:30:00","GLOVO*ORDER 7345",              cat="food"),
    T(A,"CTP Cluj",       5.00,"2024-07-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),

    # ── 2024 August ─────────────────────────────────────────────────────
    T(A,"Netflix",       29.99,"2024-08-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          49.20,"2024-08-05T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     15.00,"2024-08-09T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Tazz",          43.50,"2024-08-14T21:00:00","TAZZ*ORDER 8456",               cat="food"),
    T(A,"Penny",         37.80,"2024-08-20T17:00:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"CFR Călători",  95.00,"2024-08-25T09:00:00","CFR CALATORI",        loc="Online", cat="transport"),

    # ── 2024 Septembrie ─────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-09-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       29.99,"2024-09-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Elefant.ro",   145.00,"2024-09-03T20:00:00","ELEFANT.RO ONLINE",   loc="Online", cat="education"),
    T(A,"Lidl",          47.60,"2024-09-07T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     16.50,"2024-09-10T09:15:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         39.00,"2024-09-16T20:00:00","GLOVO*ORDER 9567",              cat="food"),
    T(A,"Penny",         44.30,"2024-09-21T18:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2024 Octombrie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-10-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       29.99,"2024-10-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          53.10,"2024-10-04T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     17.00,"2024-10-08T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Farmacia Tei",  28.50,"2024-10-12T16:00:00","FARMACIA TEI CLUJ",             cat="service"),
    T(A,"Glovo",         46.00,"2024-10-17T21:00:00","GLOVO*ORDER 10678",             cat="food"),
    T(A,"Penny",         39.70,"2024-10-22T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2024 Noiembrie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-11-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       29.99,"2024-11-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          48.90,"2024-11-05T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     18.00,"2024-11-08T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"eMag",         349.00,"2024-11-11T20:00:00","EMAG.RO *ONLINE",     loc="Online", cat="retail"),
    T(A,"Glovo",         41.00,"2024-11-16T20:30:00","GLOVO*ORDER 11789",             cat="food"),
    T(A,"Penny",         36.20,"2024-11-22T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2024 Decembrie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2024-12-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       29.99,"2024-12-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Kaufland",      92.40,"2024-12-05T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     20.00,"2024-12-09T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"CFR Călători", 134.00,"2024-12-20T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Glovo",         62.00,"2024-12-23T20:00:00","GLOVO*ORDER 12890",             cat="food"),
    T(A,"Farmacia Tei",  45.60,"2024-12-27T16:00:00","FARMACIA TEI CLUJ",             cat="service"),

    # ── 2025 Ianuarie (job 1200, fără bursă, fără internship încă) ──────
    T(A,"CTP Cluj",       5.00,"2025-01-02T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-01-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          55.30,"2025-01-06T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     19.00,"2025-01-09T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         48.00,"2025-01-14T21:00:00","GLOVO*ORDER 20001",             cat="food"),
    T(A,"Penny",         42.10,"2025-01-20T17:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"KFC",           27.00,"2025-01-24T14:00:00","KFC CLUJ IULIUS",               cat="food"),
    T(A,"Uber",          13.00,"2025-01-28T23:00:00","UBER* TRIP RO",                 cat="transport"),

    # ── 2025 Februarie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-02-03T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-02-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          49.80,"2025-02-07T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     21.00,"2025-02-10T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Elefant.ro",   112.00,"2025-02-13T20:00:00","ELEFANT.RO ONLINE",   loc="Online", cat="education"),
    T(A,"Glovo",         39.00,"2025-02-18T21:00:00","GLOVO*ORDER 20234",             cat="food"),
    T(A,"Penny",         36.40,"2025-02-23T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Martie ─────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-03-03T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-03-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          51.60,"2025-03-06T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     22.50,"2025-03-10T09:15:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         44.00,"2025-03-15T21:00:00","GLOVO*ORDER 20456",             cat="food"),
    T(A,"Cinema City",   38.00,"2025-03-22T18:30:00","CINEMA CITY IULIUS",            cat="entertainment"),
    T(A,"Penny",         40.70,"2025-03-28T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Aprilie ────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-04-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-04-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          46.20,"2025-04-05T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     20.00,"2025-04-09T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"CFR Călători",  98.00,"2025-04-14T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Tazz",          55.00,"2025-04-18T21:00:00","TAZZ*ORDER 20678",              cat="food"),
    T(A,"Penny",         38.90,"2025-04-25T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Mai ────────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-05-02T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-05-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          53.40,"2025-05-07T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     23.00,"2025-05-10T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         47.00,"2025-05-16T21:00:00","GLOVO*ORDER 20890",             cat="food"),
    T(A,"KFC",           26.50,"2025-05-22T14:00:00","KFC CLUJ IULIUS",               cat="food"),
    T(A,"Penny",         35.80,"2025-05-27T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Iunie ──────────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-06-02T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-06-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          48.90,"2025-06-06T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     21.50,"2025-06-10T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"CFR Călători", 115.00,"2025-06-20T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Glovo",         41.00,"2025-06-24T21:00:00","GLOVO*ORDER 21012",             cat="food"),
    T(A,"Penny",         37.60,"2025-06-28T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Iulie ──────────────────────────────────────────────────────
    T(A,"Netflix",       34.99,"2025-07-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Kaufland",      78.40,"2025-07-05T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     19.00,"2025-07-08T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         53.00,"2025-07-14T21:00:00","GLOVO*ORDER 21234",             cat="food"),
    T(A,"Penny",         41.20,"2025-07-21T17:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Uber",          15.00,"2025-07-27T23:30:00","UBER* TRIP RO",                 cat="transport"),

    # ── 2025 August ─────────────────────────────────────────────────────
    T(A,"Netflix",       34.99,"2025-08-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Lidl",          52.10,"2025-08-05T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     20.50,"2025-08-09T09:00:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Tazz",          46.00,"2025-08-14T21:00:00","TAZZ*ORDER 21456",              cat="food"),
    T(A,"Penny",         39.30,"2025-08-20T17:00:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"CFR Călători",  88.00,"2025-08-25T09:00:00","CFR CALATORI",        loc="Online", cat="transport"),

    # ── 2025 Septembrie ─────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-09-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-09-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Elefant.ro",   158.00,"2025-09-03T20:00:00","ELEFANT.RO ONLINE",   loc="Online", cat="education"),
    T(A,"Lidl",          50.40,"2025-09-07T17:30:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     22.00,"2025-09-10T09:15:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         43.00,"2025-09-17T21:00:00","GLOVO*ORDER 21678",             cat="food"),
    T(A,"Penny",         45.10,"2025-09-23T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Octombrie (internship Cegeka 2500!) ─────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-10-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-10-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Spotify",       26.99,"2025-10-10T00:01:00","SPOTIFY PREMIUM",               cat="entertainment"),
    T(A,"Kaufland",      98.60,"2025-10-05T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     28.00,"2025-10-08T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"eMag",         549.00,"2025-10-12T20:00:00","EMAG.RO *ONLINE",     loc="Online", cat="retail"),
    T(A,"Glovo",         61.00,"2025-10-18T21:00:00","GLOVO*ORDER 21890",             cat="food"),
    T(A,"Cinema City",   42.00,"2025-10-24T18:30:00","CINEMA CITY IULIUS",            cat="entertainment"),
    T(A,"Penny",         44.80,"2025-10-29T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Noiembrie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-11-03T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-11-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Spotify",       26.99,"2025-11-10T00:01:00","SPOTIFY PREMIUM",               cat="entertainment"),
    T(A,"Kaufland",     112.30,"2025-11-07T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     25.00,"2025-11-11T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"eMag",         389.00,"2025-11-11T20:00:00","EMAG.RO *ONLINE",     loc="Online", cat="retail"),
    T(A,"Glovo",         55.00,"2025-11-17T21:00:00","GLOVO*ORDER 22012",             cat="food"),
    T(A,"Uber",          17.00,"2025-11-22T23:00:00","UBER* TRIP RO",                 cat="transport"),
    T(A,"Penny",         41.50,"2025-11-27T17:30:00","PENNY MARKET CLUJ",             cat="retail"),

    # ── 2025 Decembrie ──────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2025-12-01T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2025-12-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Spotify",       26.99,"2025-12-10T00:01:00","SPOTIFY PREMIUM",               cat="entertainment"),
    T(A,"Kaufland",     134.50,"2025-12-05T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     30.00,"2025-12-09T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"CFR Călători", 145.00,"2025-12-20T10:00:00","CFR CALATORI",        loc="Online", cat="transport"),
    T(A,"Glovo",         72.00,"2025-12-23T20:00:00","GLOVO*ORDER 22234",             cat="food"),
    T(A,"Farmacia Tei",  38.90,"2025-12-27T16:00:00","FARMACIA TEI CLUJ",             cat="service"),

    # ── 2026 Ianuarie ───────────────────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2026-01-06T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2026-01-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Spotify",       26.99,"2026-01-10T00:01:00","SPOTIFY PREMIUM",               cat="entertainment"),
    T(A,"Kaufland",      89.20,"2026-01-08T11:00:00","KAUFLAND CLUJ IRIS",            cat="retail"),
    T(A,"Starbucks",     27.50,"2026-01-10T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         58.00,"2026-01-16T21:00:00","GLOVO*ORDER 23001",             cat="food"),
    T(A,"Penny",         43.70,"2026-01-22T17:30:00","PENNY MARKET CLUJ",             cat="retail"),
    T(A,"Udemy",         89.99,"2026-01-25T20:00:00","UDEMY ONLINE",        loc="Online", cat="education"),

    # ── 2026 Februarie (până pe 24) ─────────────────────────────────────
    T(A,"CTP Cluj",       5.00,"2026-02-03T08:00:00","CTP CLUJ ABONAMENT",            cat="transport"),
    T(A,"Netflix",       34.99,"2026-02-10T00:00:00","NETFLIX.COM",                   cat="entertainment"),
    T(A,"Spotify",       26.99,"2026-02-10T00:01:00","SPOTIFY PREMIUM",               cat="entertainment"),
    T(A,"Lidl",          54.30,"2026-02-07T18:00:00","LIDL CLUJ MARASTI",             cat="retail"),
    T(A,"Starbucks",     24.00,"2026-02-11T09:30:00","STARBUCKS CLUJ UNIRII",         cat="food"),
    T(A,"Glovo",         49.00,"2026-02-18T21:00:00","GLOVO*ORDER 23234",             cat="food"),
    T(A,"Penny",         38.60,"2026-02-22T17:00:00","PENNY MARKET CLUJ",             cat="retail"),

    # ══════════════════════════════════════════════════════════════════════
    # MARIA IONESCU — ajutor părinți 2000, shopping intens, Uber > CTP
    # din mai 2025: job part-time Zara +900 RON
    # ══════════════════════════════════════════════════════════════════════

    T(M,"Kaufland",      112.30,"2024-01-04T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-01-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-01-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Starbucks",      34.00,"2024-01-08T10:00:00","STARBUCKS CLUJ UNIRII",        cat="food"),
    T(M,"Uber",           18.50,"2024-01-10T22:30:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Tazz",           67.00,"2024-01-14T20:00:00","TAZZ*ORDER 1011",              cat="food"),
    T(M,"H&M",           189.00,"2024-01-18T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Digi",           39.99,"2024-01-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Cinema City",    42.00,"2024-01-24T19:30:00","CINEMA CITY IULIUS",           cat="entertainment"),
    T(M,"Kaufland",       98.60,"2024-02-03T18:30:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-02-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-02-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Starbucks",      31.00,"2024-02-08T10:30:00","STARBUCKS CLUJ UNIRII",        cat="food"),
    T(M,"Zara",          245.00,"2024-02-12T14:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Uber",           21.00,"2024-02-14T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Tazz",           55.00,"2024-02-18T21:00:00","TAZZ*ORDER 2122",              cat="food"),
    T(M,"Digi",           39.99,"2024-02-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Kaufland",      121.40,"2024-03-02T18:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-03-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-03-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Starbucks",      28.00,"2024-03-07T10:00:00","STARBUCKS CLUJ UNIRII",        cat="food"),
    T(M,"Uber",           15.00,"2024-03-09T22:30:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Glovo",          72.00,"2024-03-13T20:30:00","GLOVO*ORDER 3233",             cat="food"),
    T(M,"H&M",           156.00,"2024-03-16T15:30:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Digi",           39.99,"2024-03-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Kaufland",       89.70,"2024-04-01T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-04-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-04-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Zara",          312.00,"2024-04-11T14:30:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Uber",           19.00,"2024-04-13T23:30:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Tazz",           61.00,"2024-04-18T20:00:00","TAZZ*ORDER 4344",              cat="food"),
    T(M,"Digi",           39.99,"2024-04-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Fever",          89.00,"2024-04-26T21:00:00","FEVER EVENTS RO",              cat="entertainment"),
    T(M,"Kaufland",      103.20,"2024-05-03T18:30:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-05-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-05-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Starbucks",      29.00,"2024-05-08T10:00:00","STARBUCKS CLUJ UNIRII",        cat="food"),
    T(M,"Uber",           17.50,"2024-05-11T22:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Glovo",          58.00,"2024-05-16T21:00:00","GLOVO*ORDER 5455",             cat="food"),
    T(M,"H&M",           201.00,"2024-05-19T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Digi",           39.99,"2024-05-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Kaufland",       77.80,"2024-06-02T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-06-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-06-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Zara",          178.00,"2024-06-22T15:30:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Digi",           39.99,"2024-06-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Kaufland",      134.50,"2024-07-04T18:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-07-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-07-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Uber",           28.00,"2024-07-12T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Glovo",          81.00,"2024-07-17T21:30:00","GLOVO*ORDER 7677",             cat="food"),
    T(M,"H&M",           267.00,"2024-07-20T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Digi",           39.99,"2024-07-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Fever",         120.00,"2024-07-26T21:00:00","FEVER EVENTS RO",              cat="entertainment"),
    T(M,"Kaufland",       91.20,"2024-08-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-08-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-08-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Tazz",           74.00,"2024-08-13T20:00:00","TAZZ*ORDER 8788",              cat="food"),
    T(M,"Digi",           39.99,"2024-08-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          289.00,"2024-08-23T15:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Kaufland",      108.40,"2024-09-02T18:30:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-09-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-09-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Uber",           16.00,"2024-09-10T22:30:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Glovo",          63.00,"2024-09-15T21:00:00","GLOVO*ORDER 9899",             cat="food"),
    T(M,"Digi",           39.99,"2024-09-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"H&M",           178.00,"2024-09-21T15:30:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Kaufland",      115.60,"2024-10-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-10-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-10-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Tazz",           58.00,"2024-10-12T20:30:00","TAZZ*ORDER 10910",             cat="food"),
    T(M,"Uber",           20.00,"2024-10-15T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Digi",           39.99,"2024-10-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Kaufland",       99.30,"2024-11-02T18:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-11-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-11-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"eMag",          567.00,"2024-11-11T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(M,"Glovo",          71.00,"2024-11-19T21:00:00","GLOVO*ORDER 11021",            cat="food"),
    T(M,"Digi",           39.99,"2024-11-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          334.00,"2024-11-23T15:30:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Kaufland",      143.80,"2024-12-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        29.99,"2024-12-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2024-12-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"H&M",           223.00,"2024-12-10T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Digi",           39.99,"2024-12-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Tazz",           88.00,"2024-12-21T20:30:00","TAZZ*ORDER 12132",             cat="food"),
    T(M,"Fever",         145.00,"2024-12-28T22:00:00","FEVER EVENTS RO",              cat="entertainment"),
    # 2025 Maria (job din mai, cheltuieli mai controlate)
    T(M,"Kaufland",      105.40,"2025-01-04T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-01-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-01-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-01-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          278.00,"2025-01-15T14:30:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Uber",           22.00,"2025-01-18T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Tazz",           64.00,"2025-01-24T21:00:00","TAZZ*ORDER 20001",             cat="food"),
    T(M,"Kaufland",       98.20,"2025-02-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-02-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-02-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-02-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"H&M",           195.00,"2025-02-14T14:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Glovo",          59.00,"2025-02-19T21:00:00","GLOVO*ORDER 20234",            cat="food"),
    T(M,"Kaufland",      112.60,"2025-03-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-03-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-03-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-03-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          245.00,"2025-03-15T15:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Uber",           19.00,"2025-03-22T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Kaufland",       89.40,"2025-04-02T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-04-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-04-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-04-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Tazz",           72.00,"2025-04-17T21:00:00","TAZZ*ORDER 20456",             cat="food"),
    # Mai 2025 — job Zara, cheltuieli mai echilibrate
    T(M,"Kaufland",       95.10,"2025-05-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-05-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-05-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-05-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"H&M",           134.00,"2025-05-12T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Glovo",          55.00,"2025-05-19T21:00:00","GLOVO*ORDER 20678",            cat="food"),
    T(M,"Kaufland",      101.30,"2025-06-02T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-06-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-06-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-06-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          189.00,"2025-06-14T15:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Kaufland",      118.50,"2025-07-04T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-07-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-07-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-07-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"H&M",           156.00,"2025-07-18T15:30:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Fever",         110.00,"2025-07-25T22:00:00","FEVER EVENTS RO",              cat="entertainment"),
    T(M,"Kaufland",       97.80,"2025-08-04T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-08-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-08-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-08-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Tazz",           68.00,"2025-08-14T21:00:00","TAZZ*ORDER 21012",             cat="food"),
    T(M,"Kaufland",      109.20,"2025-09-02T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-09-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-09-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-09-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          210.00,"2025-09-13T15:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Kaufland",      122.40,"2025-10-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-10-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-10-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-10-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"eMag",          445.00,"2025-10-12T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(M,"Kaufland",       93.60,"2025-11-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-11-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-11-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-11-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"H&M",           167.00,"2025-11-15T15:00:00","H&M CLUJ IULIUS",              cat="retail"),
    T(M,"Kaufland",      138.90,"2025-12-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2025-12-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2025-12-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2025-12-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Zara",          298.00,"2025-12-13T15:00:00","ZARA CLUJ IULIUS",             cat="retail"),
    T(M,"Fever",         135.00,"2025-12-27T22:00:00","FEVER EVENTS RO",              cat="entertainment"),
    T(M,"Kaufland",      108.70,"2026-01-05T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2026-01-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2026-01-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2026-01-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Uber",           21.00,"2026-01-15T23:00:00","UBER* TRIP RO",                cat="transport"),
    T(M,"Kaufland",       97.30,"2026-02-03T19:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(M,"Netflix",        34.99,"2026-02-05T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(M,"Spotify",        26.99,"2026-02-05T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(M,"Digi",           39.99,"2026-02-20T00:00:00","DIGI ROMANIA",                 cat="service"),
    T(M,"Tazz",           62.00,"2026-02-14T21:00:00","TAZZ*ORDER 23456",             cat="food"),

    # ══════════════════════════════════════════════════════════════════════
    # RADU MOLDOVAN — internship 3500 (2024) → full-time 5500 (2025+)
    # Mașină proprie: OMV ~3x/lună, cheltuieli mari, Steam, abonamente
    # ══════════════════════════════════════════════════════════════════════

    T(R,"OMV",           220.00,"2024-01-05T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      134.50,"2024-01-06T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-01-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-01-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",          89.00,"2024-01-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"Starbucks",      24.00,"2024-01-12T09:00:00","STARBUCKS CLUJ UNIRII",        cat="food"),
    T(R,"OMV",           195.00,"2024-01-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Tazz",           78.00,"2024-01-19T21:00:00","TAZZ*ORDER 1213",              cat="food"),
    T(R,"Enel",          187.50,"2024-01-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-01-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"eMag",          449.00,"2024-01-22T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           210.00,"2024-01-26T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           205.00,"2024-02-02T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      118.30,"2024-02-03T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-02-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-02-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           215.00,"2024-02-13T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Udemy",          89.99,"2024-02-15T20:00:00","UDEMY ONLINE",        loc="Online", cat="education"),
    T(R,"Enel",          172.30,"2024-02-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-02-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"Glovo",          65.00,"2024-02-22T21:00:00","GLOVO*ORDER 2314",             cat="food"),
    T(R,"OMV",           198.00,"2024-02-27T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           212.00,"2024-03-01T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      145.60,"2024-03-02T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-03-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-03-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",          789.00,"2024-03-10T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           225.00,"2024-03-15T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          165.80,"2024-03-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-03-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           200.00,"2024-03-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           218.00,"2024-04-05T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      128.90,"2024-04-06T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-04-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-04-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         124.99,"2024-04-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           207.00,"2024-04-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          158.40,"2024-04-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-04-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           195.00,"2024-04-26T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           222.00,"2024-05-03T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      141.20,"2024-05-04T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-05-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-05-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           210.00,"2024-05-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          143.60,"2024-05-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-05-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           198.00,"2024-05-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    # ... continuăm pattern-ul similar pentru Radu până în feb 2026
    T(R,"OMV",           215.00,"2024-06-04T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      122.80,"2024-06-05T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-06-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-06-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           204.00,"2024-06-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          138.90,"2024-06-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-06-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           221.00,"2024-06-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           230.00,"2024-07-05T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      158.40,"2024-07-06T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-07-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-07-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",          59.99,"2024-07-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           218.00,"2024-07-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          201.30,"2024-07-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-07-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           212.00,"2024-07-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           208.00,"2024-08-02T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      134.60,"2024-08-03T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-08-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-08-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           225.00,"2024-08-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          218.40,"2024-08-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-08-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           199.00,"2024-08-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           214.00,"2024-09-06T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      149.20,"2024-09-07T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-09-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-09-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",          934.00,"2024-09-10T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           220.00,"2024-09-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          178.60,"2024-09-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-09-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           207.00,"2024-09-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           218.00,"2024-10-04T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      138.70,"2024-10-05T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-10-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-10-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           211.00,"2024-10-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          192.80,"2024-10-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-10-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           205.00,"2024-10-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           222.00,"2024-11-01T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      145.30,"2024-11-02T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-11-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-11-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",         1249.00,"2024-11-11T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           216.00,"2024-11-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          205.40,"2024-11-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-11-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           198.00,"2024-11-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           228.00,"2024-12-06T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      167.80,"2024-12-07T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        29.99,"2024-12-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2024-12-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         189.99,"2024-12-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           215.00,"2024-12-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          222.30,"2024-12-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2024-12-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           210.00,"2024-12-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    # 2025 Radu — full-time Bosch 5500 RON, cheltuieli mai mari
    T(R,"OMV",           235.00,"2025-01-03T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      178.40,"2025-01-04T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-01-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-01-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           228.00,"2025-01-13T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"eMag",          789.00,"2025-01-15T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"Enel",          198.60,"2025-01-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-01-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           219.00,"2025-01-27T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           241.00,"2025-02-07T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      162.30,"2025-02-08T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-02-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-02-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           225.00,"2025-02-15T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          187.40,"2025-02-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-02-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           214.00,"2025-02-27T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           238.00,"2025-03-07T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      171.60,"2025-03-08T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-03-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-03-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         249.99,"2025-03-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           222.00,"2025-03-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          175.20,"2025-03-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-03-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           230.00,"2025-03-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           244.00,"2025-04-04T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      155.80,"2025-04-05T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-04-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-04-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",         1678.00,"2025-04-10T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           218.00,"2025-04-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          163.80,"2025-04-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-04-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           227.00,"2025-04-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           232.00,"2025-05-02T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      168.40,"2025-05-03T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-05-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-05-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           221.00,"2025-05-13T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          149.60,"2025-05-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-05-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           239.00,"2025-05-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           226.00,"2025-06-06T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      145.20,"2025-06-07T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-06-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-06-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           215.00,"2025-06-16T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          138.40,"2025-06-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-06-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           233.00,"2025-06-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           248.00,"2025-07-04T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      182.60,"2025-07-05T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-07-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-07-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         189.99,"2025-07-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           229.00,"2025-07-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          224.80,"2025-07-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-07-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           241.00,"2025-07-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           235.00,"2025-08-01T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      159.30,"2025-08-02T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-08-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-08-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",         2345.00,"2025-08-10T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           222.00,"2025-08-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          238.60,"2025-08-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-08-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           237.00,"2025-08-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           243.00,"2025-09-05T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      172.40,"2025-09-06T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-09-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-09-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           228.00,"2025-09-15T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          181.20,"2025-09-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-09-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           235.00,"2025-09-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           251.00,"2025-10-03T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      164.80,"2025-10-04T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-10-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-10-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         299.99,"2025-10-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           234.00,"2025-10-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          196.40,"2025-10-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-10-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           219.00,"2025-10-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           247.00,"2025-11-07T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      178.90,"2025-11-08T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-11-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-11-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"eMag",         3450.00,"2025-11-11T20:00:00","EMAG.RO *ONLINE",    loc="Online", cat="retail"),
    T(R,"OMV",           226.00,"2025-11-15T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          211.80,"2025-11-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-11-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           238.00,"2025-11-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           255.00,"2025-12-05T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      195.60,"2025-12-06T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2025-12-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2025-12-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"Steam",         449.99,"2025-12-10T20:00:00","STEAM GAMES",         loc="Online", cat="entertainment"),
    T(R,"OMV",           241.00,"2025-12-15T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          228.40,"2025-12-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2025-12-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           232.00,"2025-12-28T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           249.00,"2026-01-09T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      182.30,"2026-01-10T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2026-01-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2026-01-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           237.00,"2026-01-17T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          214.60,"2026-01-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2026-01-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           225.00,"2026-01-27T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"OMV",           252.00,"2026-02-06T17:30:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Kaufland",      169.40,"2026-02-07T11:00:00","KAUFLAND CLUJ IRIS",           cat="retail"),
    T(R,"Netflix",        34.99,"2026-02-07T00:00:00","NETFLIX.COM",                  cat="entertainment"),
    T(R,"Spotify",        26.99,"2026-02-07T00:01:00","SPOTIFY PREMIUM",              cat="entertainment"),
    T(R,"OMV",           231.00,"2026-02-14T16:00:00","OMV CLUJ DN1",                 cat="gas"),
    T(R,"Enel",          203.20,"2026-02-20T00:00:00","ENEL ENERGIE RO",              cat="service"),
    T(R,"Digi",           59.99,"2026-02-20T00:01:00","DIGI ROMANIA",                 cat="service"),
    T(R,"OMV",           243.00,"2026-02-22T17:00:00","OMV CLUJ DN1",                 cat="gas"),
    
    # ── CARREFOUR BANEASA ──────────────────────────────────────────────
    T(M,"Carrefour Baneasa", 215.30,"2026-02-10T14:00:00","CARREFOUR BANEASA", cat="retail"),
    T(M,"Carrefour Baneasa", 168.90,"2026-02-24T18:30:00","CARREFOUR BANEASA", cat="retail"),
    T(M,"Carrefour Baneasa", 312.75,"2026-03-03T11:00:00","CARREFOUR BANEASA", cat="retail"),
]


# ──────────────────────────────────────────────────────────────────────────────
# SEED RUNNER
# ──────────────────────────────────────────────────────────────────────────────

def seed(db: DatabaseClient) -> None:
    print("\n  Starting rich database seed (Jan 2024 – Feb 2026)...\n")

    # 1. Users
    user_map: dict[str, str] = {}
    for u in USERS:
        existing = db.get_user_by_email(u["email"])
        if existing:
            print(f"     User exists: {u['email']}")
            user_map[u["email"]] = existing["id"]
        else:
            created = db.create_user(u["name"], "password123", email=u["email"])
            user_map[u["email"]] = created["id"]
            print(f"   ✅  User: {u['name']} → {created['id']}")

    # 2. Income sources with history (DISABLED - method missing)
    print("\n     Skipping income sources (not implemented yet)...")
    # income_id_map: dict[tuple, str] = {}  # (email, type, started) → id
    # for email, sources in INCOME_HISTORY.items():
    #     uid = user_map[email]
    #     for (stype, amount, started, ended, employer, notes) in sources:
    #         src = db.add_income_source(uid, stype, amount, started,
    #                                    employer=employer, notes=notes)
    #         if ended:
    #             db.end_income_source(src["id"], ended)
    #             status = f"ended {ended}"
    #         else:
    #             status = "active"
    #         print(f"     {email.split('@')[0]:15s} | {stype:20s} | "
    #               f"{amount:6.0f} RON/mo | {started} → {status}")

    # 3. Merchants
    print("\n     Upserting merchants...")
    merchant_map: dict[str, str] = {}
    for m in MERCHANTS:
        result = db.upsert_merchant(m)
        merchant_map[m["canonical_name"]] = result["id"]
    print(f"     {len(MERCHANTS)} merchants ready")

    # 4. Transactions
    print(f"\n     Inserting {len(TRANSACTIONS)} transactions...")
    count = 0
    for tx in TRANSACTIONS:
        uid = user_map[tx["user_email"]]
        mid = merchant_map.get(tx["merchant_name"])
        db.insert_transaction(
            user_id        = uid,
            merchant_name  = tx["merchant_name"],
            amount         = tx["amount"],
            date           = tx["date"],
            raw_pos_string = tx["raw_pos_string"],
            city           = tx.get("location", "Cluj-Napoca"),
            county         = CITY_TO_COUNTY.get(tx.get("location", "Cluj-Napoca"), ""),
            category       = tx.get("category", "other"),
            merchant_id    = mid,
        )
        count += 1
    print(f"     {count} transactions inserted")

    # 5. Financial snapshots for every month (DISABLED)
    print("\n     Skipping financial snapshots (method missing)...")
    months = []
    # for year in range(2024, 2027):
    #     for month in range(1, 13):
    #         m = f"{year}-{month:02d}"
    #         if m > "2026-02":
    #             break
    #         months.append(m)

    # for email, uid in user_map.items():
    #     for month in months:
    #         snap = db.upsert_financial_snapshot(uid, month)
    #         if snap["total_spent"] > 0 or snap["total_income"] > 0:
    #             print(f"     {email.split('@')[0]:15s} | {month} | "
    #                   f"income: {snap['total_income']:7.0f} | "
    #                   f"spent: {snap['total_spent']:7.2f} | "
    #                   f"saved: {snap['saved']:+8.2f}")

    # 6. Summary
    health = db.health_check()
    print(f"\n  Seed complete!\n    Row counts: {health['row_counts']}\n")


if __name__ == "__main__":
    db = DatabaseClient()
    seed(db)