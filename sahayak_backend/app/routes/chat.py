from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from app.auth import get_current_user
from app.models import User
from app.services.recommendation import get_recommended_schemes

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str

@router.post("/")
def chat_with_groq(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        # Build personalized system instruction
        system_instruction = (
            "You are Sahayak AI, an intelligent assistant designed to help Indian citizens find and apply for government schemes.\n\n"
            "Here is the information about the citizen you are helping:\n"
            f"- Name: {current_user.full_name}\n"
            f"- Age: {current_user.age} years\n"
            f"- Gender: {current_user.gender}\n"
            f"- Location: {current_user.district or 'N/A'}, {current_user.state}\n"
            f"- Occupation: {current_user.occupation or 'N/A'}\n"
            f"- Annual Income: Rs. {current_user.annual_income or 'N/A'}\n"
            f"- Category: {current_user.category or 'N/A'}\n"
            f"- Education: {current_user.education_level or 'N/A'}\n"
            f"- Marital Status: {current_user.marital_status or 'N/A'}\n"
            f"- Disability Status: {'Yes' if current_user.disability_status else 'No'}\n\n"
            "Based on their profile, they qualify for the following government schemes:\n"
        )

        # Retrieve recommended schemes for the user
        eligible_schemes = get_recommended_schemes(current_user)
        if eligible_schemes:
            for i, scheme in enumerate(eligible_schemes[:5], 1): # Limit to top 5 to fit context window and save tokens
                system_instruction += f"{i}. **{scheme['scheme_name']}** (Category: {scheme.get('schemeCategory', 'General')}, Benefit: {scheme.get('benefits', 'N/A')})\n"
                system_instruction += f"   Apply Link: https://www.myscheme.gov.in/schemes/{scheme['slug']}\n"
        else:
            system_instruction += "No eligible schemes found based on their current profile.\n"

        system_instruction += (
            "\nInstructions:\n"
            "1. Be extremely concise, direct, and polite. Keep answers under 120 words to minimize token usage.\n"
            "2. If they ask about schemes they are eligible for, list the matches above and include their official apply links (e.g. `https://www.myscheme.gov.in/schemes/{{slug}}`).\n"
            "3. Recommend schemes relevant to their question and guide them on how to qualify or apply.\n"
            "4. Use the user's details to personalize your answers (e.g., if they ask about education schemes, note if their profile matches the requirements)."
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_instruction),
                ("user", "{question}")
            ]
        )

        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.6,
            max_tokens=250
        )
        output_parser = StrOutputParser()
        chain = prompt | llm | output_parser
        answer = chain.invoke({"question": request.question})
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
