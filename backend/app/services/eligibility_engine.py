from datetime import date


def calculate_age(dob):

    today = date.today()

    return (
        today.year
        - dob.year
        - (
            (today.month, today.day)
            <
            (dob.month, dob.day)
        )
    )
def is_eligible(
    user,
    scheme
):

    age = user["age"]

    if (
        scheme["min_age"]
        is not None
    ):
        if age < scheme["min_age"]:
            return False

    if (
        scheme["max_age"]
        is not None
    ):
        if age > scheme["max_age"]:
            return False

    if (
        scheme["gender"]
        != "Any"
        and
        scheme["gender"]
        != user["gender"]
    ):
        return False

    if (
        scheme["state"]
        != "All India"
        and
        scheme["state"]
        != user["state"]
    ):
        return False

    if (
        scheme["category"]
        != "Any"
        and
        scheme["category"]
        != user["category"]
    ):
        return False

    if (
        scheme["occupation"]
        != "Any"
        and
        scheme["occupation"]
        != user["occupation"]
    ):
        return False

    if (
        scheme["income_limit"]
        is not None
    ):
        if (
            user["annual_income"]
            >
            scheme["income_limit"]
        ):
            return False

    return True