"""Run session state and the pub/sub event channel consumed by WebSocket clients."""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


class RunRequestError(Exception):
  def __init__(self, message: str, status_code: int = 400, details: dict[str, Any] | None = None):
    super().__init__(message)
    self.message = message
    self.status_code = status_code
    self.details = details or {}


@dataclass
class RunSession:
  run_id: str
  run_type: str
  sim_params: dict[str, Any]
  training_params: dict[str, Any] | None
  selected_model: str | None
  status: str = 'pending'
  started_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec='seconds'))
  events: list[dict[str, Any]] = field(default_factory=list)
  subscribers: set[asyncio.Queue] = field(default_factory=set)
  stop_requested: bool = False
  sequence: int = 0
  task: asyncio.Task | None = None
  live_metrics: list[dict[str, Any]] = field(default_factory=list)
  episode_metrics: list[dict[str, Any]] = field(default_factory=list)
  latest_heatmap: dict[str, Any] | None = None

  async def publish(self, event_type: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    self.sequence += 1
    event = {
      'type': event_type,
      'runId': self.run_id,
      'sequence': self.sequence,
      'emittedAt': datetime.now().isoformat(timespec='seconds'),
      **(data or {}),
    }
    self.events.append(event)

    for queue in list(self.subscribers):
      await queue.put(event)

    return event

  def subscribe(self) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    self.subscribers.add(queue)
    return queue

  def unsubscribe(self, queue: asyncio.Queue) -> None:
    self.subscribers.discard(queue)
