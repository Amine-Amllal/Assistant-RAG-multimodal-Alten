import queue
import threading
from pathlib import Path

from app.services.ingestion import run_ingestion

# Docling parsing + embedding + VLM captioning are CPU/memory heavy. Letting FastAPI's
# BackgroundTasks run one per upload request meant a bulk upload (several POSTs in quick
# succession) processed documents concurrently, which overloaded the laptop and caused
# sqlite/Chroma write contention severe enough to fail some documents outright. A single
# worker thread pulling from this queue guarantees documents are ingested strictly one
# at a time, in upload order, regardless of how many uploads arrive at once.
_queue: "queue.Queue[tuple[str, str, Path]]" = queue.Queue()
_worker_started = False
_worker_lock = threading.Lock()


def _worker_loop() -> None:
    while True:
        document_id, document_name, file_path = _queue.get()
        try:
            run_ingestion(document_id, document_name, file_path)
        finally:
            _queue.task_done()


def start_worker() -> None:
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return
        threading.Thread(target=_worker_loop, daemon=True).start()
        _worker_started = True


def enqueue(document_id: str, document_name: str, file_path: Path) -> None:
    _queue.put((document_id, document_name, file_path))
