"""
HopeLine Backend Algorithms
Python implementation matching C++ PriorityEngine, PriorityQueue (Max-Heap), and DonorMatching.
"""

from typing import List, Dict, Any, Optional, Tuple

class PriorityEngine:
    @staticmethod
    def calculate_priority(severity: int, risk_level: int, waiting_time: int) -> int:
        wait_score = min(waiting_time // 5, 10)
        return (severity * 5) + (risk_level * 3) + (wait_score * 2)

class MaxHeapQueue:
    """Demonstrates Max-Heap Priority Queue operations for the backend."""
    def __init__(self):
        self.heap: List[Dict[str, Any]] = []

    def parent(self, i: int) -> int:
        return (i - 1) // 2

    def left_child(self, i: int) -> int:
        return 2 * i + 1

    def right_child(self, i: int) -> int:
        return 2 * i + 2

    def insert(self, patient: Dict[str, Any]):
        self.heap.append(patient)
        self._heapify_up(len(self.heap) - 1)

    def extract_max(self) -> Optional[Dict[str, Any]]:
        if not self.heap:
            return None
        if len(self.heap) == 1:
            return self.heap.pop()

        root = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._heapify_down(0)
        return root

    def _heapify_up(self, i: int):
        while i > 0 and self.heap[i]["priority_score"] > self.heap[self.parent(i)]["priority_score"]:
            p = self.parent(i)
            self.heap[i], self.heap[p] = self.heap[p], self.heap[i]
            i = p

    def _heapify_down(self, i: int):
        max_idx = i
        l = self.left_child(i)
        r = self.right_child(i)

        if l < len(self.heap) and self.heap[l]["priority_score"] > self.heap[max_idx]["priority_score"]:
            max_idx = l
        if r < len(self.heap) and self.heap[r]["priority_score"] > self.heap[max_idx]["priority_score"]:
            max_idx = r

        if i != max_idx:
            self.heap[i], self.heap[max_idx] = self.heap[max_idx], self.heap[i]
            self._heapify_down(max_idx)

class BloodDonorMatcher:
    COMPATIBILITY_MAP = {
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": ["O+", "A+", "B+", "AB+"],
        "A-": ["A-", "A+", "AB-", "AB+"],
        "A+": ["A+", "AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB-", "AB+"],
        "AB+": ["AB+"]
    }

    @classmethod
    def is_compatible(cls, donor_group: str, patient_group: str) -> bool:
        allowed = cls.COMPATIBILITY_MAP.get(donor_group, [])
        return patient_group in allowed

    @classmethod
    def calculate_match(cls, donor: Dict[str, Any], patient_blood_group: str, urgency_score: int) -> Dict[str, Any]:
        d_group = donor["blood_group"]
        compatible = cls.is_compatible(d_group, patient_blood_group)
        if not compatible:
            return {
                "score": 0,
                "compatible": False,
                "compatibility_score": 0,
                "availability_score": 0,
                "distance_score": 0,
                "urgency_score": 0,
                "donor": donor
            }

        compat_score = 50 if d_group == patient_blood_group else 40
        avail_score = 20 if donor["available"] else 0
        distance = donor["distance"]
        dist_score = max(0, min(20, 20 - (distance // 5)))
        urg_score = min(100, max(0, urgency_score)) // 10

        total_score = compat_score + avail_score + dist_score + urg_score
        return {
            "score": total_score,
            "compatible": True,
            "compatibility_score": compat_score,
            "availability_score": avail_score,
            "distance_score": dist_score,
            "urgency_score": urg_score,
            "donor": donor
        }

    @classmethod
    def find_best_donor(cls, donors: List[Dict[str, Any]], patient_blood_group: str, urgency_score: int) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        candidates = []
        for d in donors:
            match = cls.calculate_match(d, patient_blood_group, urgency_score)
            if match["compatible"]:
                candidates.append(match)

        candidates.sort(key=lambda x: x["score"], reverse=True)
        best = candidates[0] if candidates else None
        return best, candidates
