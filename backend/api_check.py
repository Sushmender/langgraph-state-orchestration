import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from tavily import TavilyClient


def check_apis():
    print("====================================")
    print("[*] Running API Connectivity Check...")
    print("====================================")

    load_dotenv()
    
    groq_key = os.getenv("GROQ_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")

    if not groq_key or groq_key == "your_key_here":
        print("[!] GROQ_API_KEY is missing or not set in .env")
    else:
        try:
            # Initialize Groq client and test it
            chat = ChatGroq(model="qwen/qwen3.6-27b", temperature=0, api_key=groq_key)
            chat.invoke("Say the word 'success'")
            print("[SUCCESS] Groq API: Connection Successful!")
        except Exception as e:
            print(f"[ERROR] Groq API Error: {e}")

    if not tavily_key or tavily_key == "your_key_here":
        print("[!] TAVILY_API_KEY is missing or not set in .env")
    else:
        try:
            # Initialize Tavily client and test it
            tavily = TavilyClient(api_key=tavily_key)
            tavily.search(query="Test", max_results=1)
            print("[SUCCESS] Tavily API: Connection Successful!")
        except Exception as e:
            print(f"[ERROR] Tavily API Error: {e}")

    print("====================================")

if __name__ == "__main__":
    check_apis()
