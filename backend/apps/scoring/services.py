# Placeholder — scoring logic will be implemented in feature/scoring-engine
# All numeric score calculation must live in this file (non-negotiable rule).
# OpenAI must never calculate the numeric score.


def calculate_internet_work_score(listings) -> int:
    raise NotImplementedError


def calculate_accommodation_score(listings) -> int:
    raise NotImplementedError


def calculate_safety_services_score(listings) -> int:
    raise NotImplementedError


def calculate_transport_score(listings) -> int:
    raise NotImplementedError


def calculate_tourism_lifestyle_score(listings) -> int:
    raise NotImplementedError


def calculate_overall_score(category_scores: dict) -> dict:
    raise NotImplementedError


def get_score_label(overall_score: int) -> str:
    raise NotImplementedError


def get_top_gaps(category_scores: dict, listings) -> list:
    raise NotImplementedError


def calculate_destination_score(destination_id: int):
    raise NotImplementedError
