import asyncio
import json
import uuid
from typing import Dict, Optional

class ProgressChannel:
    def __init__(self, total_files: int = 0, total_bytes: int = 0):
        self.queue = asyncio.Queue()
        self.total_files = total_files
        self.total_bytes = total_bytes
        self.processed_files = 0
        self.processed_bytes = 0
        self.current: Optional[str] = None
        self.done = False

    def snapshot(self):
        return {
            "total_files": self.total_files,
            "total_bytes": self.total_bytes,
            "processed_files": self.processed_files,
            "processed_bytes": self.processed_bytes,
            "current": self.current,
            "done": self.done,
        }

    async def emit(self):
        await self.queue.put(self.snapshot())


class ProgressManager:
    def __init__(self):
        self.channels: Dict[str, ProgressChannel] = {}

    def create(self, total_files: int, total_bytes: int) -> str:
        pid = uuid.uuid4().hex
        self.channels[pid] = ProgressChannel(total_files, total_bytes)
        return pid

    def get(self, pid: str) -> Optional[ProgressChannel]:
        return self.channels.get(pid)

    async def stream(self, pid: str):
        ch = self.get(pid)
        if not ch:
            # one empty event so client can close gracefully
            yield f"data: {json.dumps({'error':'not_found'})}\n\n"
            return

        # emit initial snapshot
        await ch.emit()

        while True:
            try:
                item = await ch.queue.get()
                yield f"data: {json.dumps(item)}\n\n"
                # close when done
                if item.get("done"):
                    break
            except asyncio.CancelledError:
                break

    async def set_current(self, pid: str, path: str):
        ch = self.get(pid)
        if not ch:
            return
        ch.current = path
        await ch.emit()

    async def advance(self, pid: str, bytes_inc: int):
        ch = self.get(pid)
        if not ch:
            return
        ch.processed_files += 1
        ch.processed_bytes += max(0, int(bytes_inc))
        await ch.emit()

    async def finish(self, pid: str):
        ch = self.get(pid)
        if not ch:
            return
        ch.done = True
        await ch.emit()
        # keep channel around a bit; caller may clean up later

manager = ProgressManager()