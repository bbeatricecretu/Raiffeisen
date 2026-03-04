"""
mock/conversations.py - Direct messages between users
"""
import random
from typing import List, Dict, Any, Tuple
from .utils import generate_id

def get_conversations(user_ids_by_name: Dict[str, str]) -> Tuple[List[Dict], List[Dict]]:
    """
    Generate conversations and messages
    
    Returns:
        Tuple of (conversations_list, messages_list)
    """
    
    message_templates = [
        "Hey, have you been to {} lately?",
        "What do you think about {}?",
        "I saw you spent money at {}. Would you recommend it?",
        "When are we going to {} again?",
        "The offer at {} is valid until tomorrow!",
        "Do you have Raiffeisen card? You get cashback at {}.",
        "How's the traffic in {}?",
        "We're organizing a meetup at {} tomorrow.",
        "Do you know if they accept card at {}?",
        "Found a great restaurant in {}, let's try it!"
    ]
    
    merchants = ["Mega Image", "Starbucks", "KFC", "Lidl", "OMV", "La Mama", 
                 "Cinema City", "Carrefour", "Kaufland", "CFR"]
    
    conversations = []
    messages = []
    
    # Define conversation pairs
    conversation_pairs = [
        ("Alex Popescu", "Maria Ionescu"),
        ("Alex Popescu", "Andrei Georgescu"),
        ("Maria Ionescu", "Elena Dima"),
        ("Andrei Georgescu", "Radu Iancu"),
        ("Diana Popa", "Cristian Munteanu"),
        ("Ioana Vasile", "Mihai Dumitru"),
        ("Ștefan Craioveanu", "Oana Marinescu"),
        ("Vlad Petrescu", "Simona Toma"),
        ("Gabriel Enache", "Roxana Diaconu"),
        ("Adrian Gheorghiu", "Carmen Bălan"),
        ("Cristian Munteanu", "Diana Popa"),
        ("Radu Iancu", "Ioana Vasile"),
        ("Elena Dima", "Andreea Stan"),
        ("Mihai Dumitru", "Vlad Petrescu"),
        ("Alex Popescu", "Cristian Munteanu"),
    ]
    
    conv_index = 0
    
    for user1_name, user2_name in conversation_pairs:
        if user1_name in user_ids_by_name and user2_name in user_ids_by_name:
            user1_id = user_ids_by_name[user1_name]
            user2_id = user_ids_by_name[user2_name]
            
            # Sort IDs to ensure uniqueness
            sorted_ids = sorted([user1_id, user2_id])
            
            conversation_id = f"conv_{conv_index+1}"
            
            conversation = {
                "id": conversation_id,
                "user1_id": sorted_ids[0],
                "user2_id": sorted_ids[1]
            }
            conversations.append(conversation)
            
            # Generate 6-15 messages for each conversation
            num_messages = random.randint(6, 15)
            for j in range(num_messages):
                sender_id = user1_id if j % 2 == 0 else user2_id
                merchant = random.choice(merchants)
                
                message = {
                    "id": f"msg_{conv_index+1}_{j+1}",
                    "conversation_id": conversation_id,
                    "sender_id": sender_id,
                    "text": random.choice(message_templates).format(merchant)
                }
                messages.append(message)
            
            conv_index += 1
    
    return conversations, messages