"""
HopeLine Pydantic Request & Response Data Models
"""

from pydantic import BaseModel, Field
from typing import Optional

class PatientCreate(BaseModel):
    name: str = Field(..., example="Rahul Sharma")
    age: int = Field(..., ge=1, le=120, example=45)
    blood_group: str = Field(..., example="O+")
    severity: int = Field(..., ge=1, le=10, example=8)
    risk_level: int = Field(..., ge=1, le=10, example=7)
    waiting_time: int = Field(0, ge=0, example=10)
    required_resource: str = Field(..., example="ICU")

class ResourceUpdate(BaseModel):
    state: str = Field(..., example="OCCUPIED")
    patient_id: Optional[int] = None

class DonorMatchRequest(BaseModel):
    blood_group: str = Field(..., example="O+")
    urgency_score: int = Field(50, ge=0, le=100, example=75)

class RawQueryRequest(BaseModel):
    query: str = Field(..., example="SELECT * FROM patients LIMIT 5")
