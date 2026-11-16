"""Small unit tests for pure input-handling helpers."""

from app.routers.movies import escape_like


def test_escape_like_wildcards_are_literal() -> None:
    assert escape_like("50%_off!") == "%50!%!_off!!%"


def test_escape_like_plain_text() -> None:
    assert escape_like("star wars") == "%star wars%"
