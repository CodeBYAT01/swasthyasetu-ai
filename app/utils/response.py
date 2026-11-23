"""Consistent JSON response helpers for REST endpoints."""


def paginated(items: list, total: int, page: int, page_size: int) -> dict:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


DEMO_DISCLAIMER = (
    "Simulated demonstration data. Decision-support prototype; not a diagnosis, "
    "treatment or prescription. Emergency warnings require immediate local "
    "emergency escalation, not a remote doctor."
)
