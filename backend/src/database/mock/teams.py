"""
mock/teams.py - 10 teams with member assignments
Uses ONLY demo users that are guaranteed to exist in the database.
"""
from typing import List, Dict, Any, Tuple


# These names match exactly the demo users defined in users.py
_DEMO_NAMES = [
    "Alex Popescu",
    "Maria Ionescu",
    "Andrei Georgescu",
    "Elena Dima",
    "Cristian Munteanu",
    "Radu Iancu",
    "Ioana Vasile",
]

_TEAM_DEFINITIONS = [
    {
        "name": "Popescu Family",
        "image_url": "/images/teams/family.png",
        "members": ["Alex Popescu", "Maria Ionescu", "Andrei Georgescu"],
    },
    {
        "name": "AI Enthusiasts",
        "image_url": "/images/teams/ai.png",
        "members": ["Andrei Georgescu", "Elena Dima", "Cristian Munteanu", "Radu Iancu"],
    },
    {
        "name": "Cluj Friends",
        "image_url": "/images/teams/cluj.png",
        "members": ["Alex Popescu", "Radu Iancu", "Ioana Vasile", "Cristian Munteanu"],
    },
    {
        "name": "Iasi Tech Hub",
        "image_url": "/images/teams/iasi.png",
        "members": ["Elena Dima", "Ioana Vasile", "Andrei Georgescu"],
    },
    {
        "name": "Bucharest Commute",
        "image_url": "/images/teams/bucharest.png",
        "members": ["Maria Ionescu", "Elena Dima", "Radu Iancu"],
    },
    {
        "name": "Gaming Squad",
        "image_url": "/images/teams/gaming.png",
        "members": ["Cristian Munteanu", "Andrei Georgescu", "Alex Popescu"],
    },
    {
        "name": "Food Lovers Club",
        "image_url": "/images/teams/food.png",
        "members": ["Ioana Vasile", "Maria Ionescu", "Elena Dima"],
    },
    {
        "name": "Travel Buddies",
        "image_url": "/images/teams/travel.png",
        "members": ["Radu Iancu", "Cristian Munteanu", "Andrei Georgescu"],
    },
    {
        "name": "Sports Team",
        "image_url": "/images/teams/sports.png",
        "members": ["Alex Popescu", "Cristian Munteanu", "Radu Iancu"],
    },
    {
        "name": "Book Club",
        "image_url": "/images/teams/books.png",
        "members": ["Elena Dima", "Ioana Vasile", "Maria Ionescu"],
    },
]


def get_teams(user_ids_by_name: Dict[str, str]) -> Tuple[List[Dict], List[Dict]]:
    teams = []
    team_members = []

    for i, team_def in enumerate(_TEAM_DEFINITIONS):
        valid_members = [m for m in team_def["members"] if m in user_ids_by_name]

        if len(valid_members) < 2:
            continue

        team_id = f"team_{i + 1}"
        creator_name = valid_members[0]
        creator_id = user_ids_by_name[creator_name]

        teams.append({
            "id": team_id,
            "name": team_def["name"],
            "code": f"CODE{i + 1:03d}",
            "image_url": team_def["image_url"],
            "created_by": creator_id,
        })

        for member_name in valid_members:
            team_members.append({
                "user_id": user_ids_by_name[member_name],
                "team_id": team_id,
                "role": "admin" if member_name == creator_name else "member",
            })

    return teams, team_members