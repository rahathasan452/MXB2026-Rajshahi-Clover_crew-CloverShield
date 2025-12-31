import pandas as pd
import asyncio
import json
import os
import time
from typing import Optional, Generator, AsyncGenerator
from pydantic import BaseModel

class SimulationConfig(BaseModel):
    speed: float = 1.0  # Multiplier, or seconds delay? Let's say speed multiplier (1x, 2x...)
    # But for simplicity, let's treat it as "transactions per second" or delay.
    # The requirement says "Speed Slider: Adjusts how fast...".
    # Let's map speed 1-10 to delay. 
    # Speed 1 = 2 sec delay, Speed 10 = 0.1 sec delay.
    
class SimulationStatus(BaseModel):
    status: str  # "running", "paused", "stopped"
    current_index: int
    total_transactions: int
    speed: float

class SimulationManager:
    def __init__(self):
        self.dataset: Optional[pd.DataFrame] = None
        self.current_index = 0
        self.is_running = False
        self.speed = 1.0  # Default 1x speed
        self.delay = 1.0  # Seconds between transactions
        self.dataset_path = None
        
    def load_dataset(self, path: str):
        self.dataset_path = path
        # Check if file exists, if not try to find it
        if not os.path.exists(path):
            # Try finding it in common locations
            possible_paths = [
                path,
                f"dataset/{path}",
                f"../dataset/{path}",
                "dataset/test_dataset.csv.gz",
                "dataset/test_dataset.csv"
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    self.dataset_path = p
                    break
        
        if self.dataset_path and os.path.exists(self.dataset_path):
            print(f"Loading simulation dataset from {self.dataset_path}")
            # Load only necessary columns to save memory if needed
            self.dataset = pd.read_csv(self.dataset_path)
            # Ensure it's sorted by step
            if 'step' in self.dataset.columns:
                self.dataset = self.dataset.sort_values('step')
            print(f"Loaded {len(self.dataset)} transactions for simulation")
        else:
            print("Simulation dataset not found!")

    def start(self):
        if self.dataset is None:
            raise ValueError("Dataset not loaded")
        self.is_running = True
        return self.get_status()

    def stop(self):
        self.is_running = False
        return self.get_status()

    def reset(self):
        self.current_index = 0
        self.is_running = False
        return self.get_status()

    def set_speed(self, speed: float):
        self.speed = max(0.1, min(speed, 10.0)) # Clamp between 0.1 and 10
        # Formula: Higher speed = Lower delay.
        # Base delay = 2 seconds (at 1x)
        # Delay = 2 / speed
        self.delay = 2.0 / self.speed
        return self.get_status()

    def get_status(self):
        return {
            "status": "running" if self.is_running else "paused",
            "current_index": self.current_index,
            "total_transactions": len(self.dataset) if self.dataset is not None else 0,
            "speed": self.speed
        }

    async def stream_generator(self) -> AsyncGenerator[str, None]:
        """
        Yields SSE formatted data:
        data: {json_content}\n\n
        """
        while True:
            if not self.is_running:
                await asyncio.sleep(0.5)
                # yield Comment to keep connection alive
                yield ": keep-alive\n\n"
                continue

            if self.dataset is None or self.current_index >= len(self.dataset):
                self.is_running = False
                yield f"data: {json.dumps({'event': 'finished'})}\\n\\n"
                break

            # Get current transaction
            row = self.dataset.iloc[self.current_index]
            transaction = row.to_dict()
            
            # Convert numpy types to native python types for JSON serialization
            for key, value in transaction.items():
                if hasattr(value, 'item'):
                    transaction[key] = value.item()
            
            # Create payload
            payload = {
                "transaction": transaction,
                "index": self.current_index,
                "total": len(self.dataset)
            }
            
            yield f"data: {json.dumps(payload)}\\n\\n"
            
            self.current_index += 1
            
            # Wait based on speed
            await asyncio.sleep(self.delay)

simulation_manager = SimulationManager()
