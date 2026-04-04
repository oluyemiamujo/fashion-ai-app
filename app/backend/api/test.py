from dotenv import load_dotenv
import os
from openai import OpenAI

# Load .env file
load_dotenv(override=True)

api_key = os.getenv("OPENAI_API_KEY")

print("Loaded key:", api_key[:], "...")  # confirm key loads


client = OpenAI(api_key=api_key)

try:
    response = client.responses.create(
        model="gpt-4o-mini",
        input="Reply with: API key works"
    )

    print("✅ API call succeeded")
    print(response.output_text)

except Exception as e:
    print("❌ API call failed")
    print(e)