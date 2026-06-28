"""Tiny JSON cache over Redis, with graceful degradation.

The whole module is fail-open: if Redis is misconfigured, unreachable, or a call raises,
every function behaves as a cache miss / no-op rather than propagating the error. Caching
must never be able to take the app down or corrupt a response — a stale or absent cache is
always preferable to a 500.

Backend selected by settings.REDIS_URL:
  - "memory://"          -> in-process fakeredis (no server; works on the locked PC)
  - "redis://host:port/db" -> a real Redis server (OCI Cache, etc.)
  - ""                   -> disabled (all calls no-op)
"""

import json
import logging
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache
def _client():
    url = settings.REDIS_URL.strip()
    if not url:
        return None
    try:
        if url == "memory://":
            import fakeredis

            client = fakeredis.FakeRedis(decode_responses=True)
        else:
            import redis

            client = redis.Redis.from_url(url, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        logger.info("Conversation cache enabled (%s)", "fakeredis" if url == "memory://" else url)
        return client
    except Exception as exc:  # noqa: BLE001 - any failure means "run without a cache"
        logger.warning("Redis cache unavailable (%s) — continuing without caching", exc)
        return None


def get_json(key: str):
    client = _client()
    if client is None:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except Exception:  # noqa: BLE001
        return None


def set_json(key: str, value) -> None:
    client = _client()
    if client is None:
        return
    try:
        client.set(key, json.dumps(value), ex=settings.REDIS_TTL_SECONDS)
    except Exception:  # noqa: BLE001
        pass


def delete(*keys: str) -> None:
    client = _client()
    if client is None or not keys:
        return
    try:
        client.delete(*keys)
    except Exception:  # noqa: BLE001
        pass
