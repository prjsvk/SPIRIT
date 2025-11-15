import random

# Sample quiz questions — you can replace with any subject
QUESTIONS = [
    {"question": "What is 5 + 7?", "answer": "12"},
    {"question": "Who wrote the Declaration of Independence?", "answer": "Thomas Jefferson"},
    {"question": "What is the capital of Georgia?", "answer": "Atlanta"},
    {"question": "What gas do plants breathe in?", "answer": "Carbon Dioxide"},
    {"question": "What is the square root of 81?", "answer": "9"},
]

def get_random_question():
    return random.choice(QUESTIONS)