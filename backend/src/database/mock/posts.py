"""
mock/posts.py - 30 posts with comments and emoji reactions
"""
import random
from typing import List, Dict, Any, Tuple

def get_posts(team_ids: List[str], user_ids_by_name: Dict[str, str]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Generate posts, comments, and reactions
    
    Returns:
        Tuple of (posts_list, comments_list, reactions_list)
    """
    
    # Post templates
    post_templates = [
        {"title": "What do you think about {}?", 
         "text": "I noticed many of us spend money at {}. Is it worth it?"},
        {"title": "Weekly offer at {}", 
         "text": "They have 25% off on all products this week!"},
        {"title": "My experience at {}", 
         "text": "Great service, friendly staff, and fair prices. Highly recommend!"},
        {"title": "Warning: {} increased prices", 
         "text": "Prices went up again. Comparison with last month attached."},
        {"title": "Money-saving tips for {}", 
         "text": "How to save money when shopping at {}."},
        {"title": "Weekend trip to {}", 
         "text": "Any restaurant recommendations in the area?"},
        {"title": "Cashback at {}", 
         "text": "Just got 5% cashback through Raiffeisen app. Check yours!"},
        {"title": "Loyalty program at {}", 
         "text": "Is their loyalty program worth joining?"},
        {"title": "Long queue at {}", 
         "text": "Very crowded at 6 PM. Better come in the morning."},
        {"title": "New menu at {}", 
         "text": "They just launched new items. Has anyone tried them?"},
    ]
    
    # Comment templates
    comment_templates = [
        "Totally agree!",
        "I had a different experience...",
        "Thanks for the info!",
        "When did you last go?",
        "I didn't know about the offer, thanks!",
        "I also recommend it!",
        "Go on weekends, it's less crowded.",
        "Do they have a mobile app?",
        "What categories are on sale?",
        "Noted, thanks!",
        "Is it expensive?",
        "Been there, loved it!",
        "Overrated in my opinion",
        "The staff is amazing there",
        "Parking is a nightmare though"
    ]
    
    # Emojis for reactions
    emojis = ["👍", "❤️", "🔥", "😂", "😮", "😢", "👏", "🎉", "🤔", "👎", "💯", "⭐"]
    
    # Merchants to mention in posts
    merchants = ["Mega Image", "Lidl", "Kaufland", "Carrefour", "Starbucks", 
                 "McDonald's", "KFC", "OMV Petrom", "CFR", "Digi Romania"]
    
    posts = []
    comments = []
    reactions = []
    
    user_ids = list(user_ids_by_name.values())
    
    for i in range(30):
        team_id = random.choice(team_ids)
        template = random.choice(post_templates)
        merchant = random.choice(merchants)
        
        post_id = f"post_{i+1}"
        
        post = {
            "id": post_id,
            "team_id": team_id,
            "user_id": random.choice(user_ids),
            "title": template["title"].format(merchant),
            "text": template["text"].format(merchant),
            "image_url": f"/images/posts/post_{random.randint(1,5)}.jpg" if random.random() > 0.4 else None
        }
        posts.append(post)
        
        # Generate 4-8 comments for each post
        num_comments = random.randint(4, 8)
        for j in range(num_comments):
            comment = {
                "id": f"comment_{i+1}_{j+1}",
                "post_id": post_id,
                "user_id": random.choice(user_ids),
                "text": random.choice(comment_templates),
                "emoji": None
            }
            comments.append(comment)
        
        # Generate 5-12 emoji reactions for each post
        num_reactions = random.randint(5, 12)
        for _ in range(num_reactions):
            reaction = {
                "id": f"reaction_{i+1}_{_}",
                "post_id": post_id,
                "user_id": random.choice(user_ids),
                "text": None,
                "emoji": random.choice(emojis)
            }
            reactions.append(reaction)
    
    return posts, comments, reactions