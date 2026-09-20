from app.models import ConfidenceLevel


def calculate_confidence(
    report_count: int, confirmation_count: int, agent_failure_count: int
) -> ConfidenceLevel:
    total_signals = report_count + confirmation_count + agent_failure_count

    if (report_count >= 5 and confirmation_count >= 3) or agent_failure_count >= 3:
        return ConfidenceLevel.CONFIRMED

    if (
        (report_count >= 3 and confirmation_count >= 2)
        or (report_count >= 4 and confirmation_count >= 1)
        or (agent_failure_count >= 2 and report_count >= 1)
    ):
        return ConfidenceLevel.LIKELY

    if (
        report_count >= 2
        or confirmation_count >= 1
        or agent_failure_count >= 2
        or total_signals >= 3
    ):
        return ConfidenceLevel.POSSIBLE

    return ConfidenceLevel.UNVERIFIED
