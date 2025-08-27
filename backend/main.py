from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests

app = FastAPI()

class Student(BaseModel):
    First_Name: str
    Last_Name: str
    Email: str
    Primary_Phone_Number: str
    Date_of_Birth: str
    Gender: str
    Address: str
    Desired_Course: str
    Nearest_Vama_Center: str
    Preferred_Mode_of_Contact: str

GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScnUJZbm8ouP1XB1Qo7mHb8seGU_gMfn_1rR6pJ3kuq0u_Nng/formResponse"

@app.post("/add-student")
async def add_student(student: Student):
    form_data = {
        "entry.1234567890": student.First_Name,  # Replace with actual field IDs
        "entry.0987654321": student.Last_Name,
        "entry.1122334455": student.Email,
        "entry.2233445566": student.Primary_Phone_Number,
        "entry.3344556677": student.Date_of_Birth,
        "entry.4455667788": student.Gender,
        "entry.5566778899": student.Address,
        "entry.6677889900": student.Desired_Course,
        "entry.7788990011": student.Nearest_Vama_Center,
        "entry.8899001122": student.Preferred_Mode_of_Contact,
    }

    response = requests.post(GOOGLE_FORM_URL, data=form_data)
    if response.status_code == 200:
        return {"message": "Student added successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to submit to Google Form")
