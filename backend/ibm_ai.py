import os
import json
import base64
from dotenv import load_dotenv

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WATSONX_APIKEY = os.getenv("WATSONX_APIKEY")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID")
WATSONX_URL = os.getenv("WATSONX_URL")

# Check which AI service is active
AI_SERVICE = "SIMULATED"
if GEMINI_API_KEY:
    AI_SERVICE = "GEMINI"
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        print("Google Gemini AI configured successfully!")
    except Exception as e:
        print(f"Failed to configure Gemini AI: {e}. Falling back to simulated AI.")
        AI_SERVICE = "SIMULATED"
elif WATSONX_APIKEY and WATSONX_PROJECT_ID:
    AI_SERVICE = "WATSONX"
    print("IBM watsonx.ai configured successfully!")

# Environmental Categories
CATEGORIES = [
    "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage",
    "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow",
    "Construction Waste", "Deforestation", "Chemical Waste", "Other Environmental Issues"
]

def analyze_environmental_issue(image_bytes, description):
    """
    Analyzes an environmental issue from an image and a user's text description.
    Returns a dictionary with: title, category, severity, priority_score, environmental_impact, and recommended_solutions.
    """
    if AI_SERVICE == "GEMINI":
        return _analyze_with_gemini(image_bytes, description)
    elif AI_SERVICE == "WATSONX":
        return _analyze_with_watsonx(image_bytes, description)
    else:
        return _analyze_simulated(description)

def get_ecobot_response(chat_history, user_message):
    """
    Generates a response from the EcoBot assistant powered by IBM Granite / Gemini.
    """
    if AI_SERVICE == "GEMINI":
        return _chat_with_gemini(chat_history, user_message)
    elif AI_SERVICE == "WATSONX":
        return _chat_with_watsonx(chat_history, user_message)
    else:
        return _chat_simulated(user_message)


# =====================================================================
# Google Gemini Implementation
# =====================================================================
def _analyze_with_gemini(image_bytes, description):
    try:
        import google.generativeai as genai
        
        # Prepare the model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Format the image for Gemini
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_bytes
        }
        
        prompt = f"""
        You are an environmental expert analyzing an image of an environmental issue reported by a citizen.
        Review the image and the user's description of it: "{description}".

        Your task is to analyze the environmental issue and output a strictly valid JSON object.
        The JSON object must contain the following keys:
        1. "category": Must be exactly one of: "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage", "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow", "Construction Waste", "Deforestation", "Chemical Waste", or "Other Environmental Issues".
        2. "severity": Must be exactly one of: "Low", "Medium", "High", "Critical".
        3. "priority_score": Must be exactly one of: "Low", "Medium", "High", "Critical" (based on severity and risk).
        4. "title": A short, catchy title describing the issue (max 6 words).
        5. "environmental_impact": A clear, detailed description (2-3 sentences) of the ecological risks, immediate dangers, and long-term consequences of this issue.
        6. "recommended_solutions": A JSON list of 3 to 4 actionable, specific solutions to resolve or mitigate this issue.

        Response must be ONLY the raw JSON string. Do not include markdown formatting like ```json or any other text.
        """
        
        response = model.generate_content([prompt, image_part])
        response_text = response.text.strip()
        
        # Clean up any potential markdown formatting in case Gemini returns it anyway
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        data = json.loads(response_text)
        return data
    except Exception as e:
        print(f"Gemini Analysis Error: {e}. Falling back to Simulated.")
        return _analyze_simulated(description)

def _chat_with_gemini(chat_history, user_message):
    try:
        import google.generativeai as genai
        
        system_instruction = (
            "You are EcoBot, an environmental and sustainability assistant powered by AI. "
            "Your purpose is to provide clear, actionable advice on recycling, waste management, "
            "conservation, eco-friendly lifestyle choices, and environmental issues. Keep responses friendly, "
            "structured with bullet points where appropriate, and highly educational."
        )
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        
        # Format chat history for Gemini
        formatted_history = []
        for msg in chat_history:
            role = "user" if msg["sender"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg["text"]]})
            
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(user_message)
        return response.text
    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        return _chat_simulated(user_message)


# =====================================================================
# IBM watsonx.ai Implementation
# =====================================================================
def _analyze_with_watsonx(image_bytes, description):
    print("Using IBM Watsonx.ai for text/meta analysis.")
    import requests
    try:
        # Get IAM Token
        token_url = "https://iam.cloud.ibm.com/identity/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": WATSONX_APIKEY
        }
        token_res = requests.post(token_url, headers=headers, data=data).json()
        if "access_token" not in token_res:
            raise Exception("Failed to get IAM token")
        access_token = token_res["access_token"]
        
        # Setup watsonx generation request (using granite chat model)
        generate_url = f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        prompt = f"""System: You are an environmental expert. A user has reported an environmental issue with the following description: "{description}". Your task is to analyze it and output a strictly valid JSON object.
The JSON object must contain the following keys:
1. "category": Must be exactly one of: "Garbage Dumping", "Plastic Waste", "E-Waste", "Water Leakage", "Water Pollution", "Air Pollution", "Waste Burning", "Sewage Overflow", "Construction Waste", "Deforestation", "Chemical Waste", or "Other Environmental Issues".
2. "severity": Must be exactly one of: "Low", "Medium", "High", "Critical".
3. "priority_score": Must be exactly one of: "Low", "Medium", "High", "Critical".
4. "title": A short title describing the issue.
5. "environmental_impact": A clear, detailed description of the ecological risks.
6. "recommended_solutions": A JSON list of 3 actionable, highly relevant, and specific solutions to resolve this issue based on the user's description.

Response must be ONLY the raw JSON string. Do not include markdown formatting.
User: Generate the JSON analysis.
Assistant:"""
        
        payload = {
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 800,
                "min_new_tokens": 1,
                "stop_sequences": ["\nUser:", "\nSystem:"]
            },
            "model_id": "ibm/granite-13b-chat-v2",
            "project_id": WATSONX_PROJECT_ID
        }
        
        res = requests.post(generate_url, headers=headers, json=payload).json()
        if "results" not in res:
            raise Exception("No results from Watsonx API: " + str(res))
        response_text = res["results"][0]["generated_text"].strip()
        
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        data = json.loads(response_text)
        return data
    except Exception as e:
        print(f"Watsonx Analysis Error: {e}. Falling back to Simulated.")
        return _analyze_simulated(description)

def _chat_with_watsonx(chat_history, user_message):
    # Call watsonx.ai Granite chat model
    # Here is a mock wrapper that queries IBM Watsonx REST API
    import requests
    try:
        # Get IAM Token
        token_url = "https://iam.cloud.ibm.com/identity/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": WATSONX_APIKEY
        }
        token_res = requests.post(token_url, headers=headers, data=data).json()
        access_token = token_res["access_token"]
        
        # Setup watsonx generation request (using granite chat model)
        generate_url = f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        prompt = f"System: You are EcoBot, an environmental and sustainability expert. Answer the following user question.\nUser: {user_message}\nAssistant:"
        
        payload = {
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 500,
                "min_new_tokens": 1,
                "stop_sequences": ["\nUser:", "\nSystem:"]
            },
            "model_id": "ibm/granite-13b-chat-v2",
            "project_id": WATSONX_PROJECT_ID
        }
        
        res = requests.post(generate_url, headers=headers, json=payload).json()
        response_text = res["results"][0]["generated_text"]
        return response_text.strip()
    except Exception as e:
        print(f"Watsonx Chat Error: {e}. Falling back to Simulated.")
        return _chat_simulated(user_message)


# =====================================================================
# Simulated Offline Fallback Implementation
# =====================================================================
def _analyze_simulated(description):
    desc_lower = description.lower()
    
    # Categorization rules based on keywords
    if any(k in desc_lower for k in ["plastic", "bottle", "bag", "cup", "wrapper"]):
        category = "Plastic Waste"
        title = "Discarded Plastics Near Path"
        severity = "Medium"
        impact = "Plastic waste accumulates in the ecosystem, releases microplastics into the soil, and poses severe ingestion risks to local wildlife."
        solutions = ["Organize a local cleanup drive", "Install plastic recycling bins", "Implement reusable container awareness programs"]
    elif any(k in desc_lower for k in ["garbage", "dump", "trash", "rubbish", "litter"]):
        category = "Garbage Dumping"
        title = "Illegal Garbage Dumping Site"
        severity = "High"
        impact = "Uncontrolled waste piles attract pests, release foul odors, contaminate soil, and can lead to surface runoff pollution during rains."
        solutions = ["Clear the waste immediately", "Erect 'No Dumping' warning signs", "Install security cameras to deter fly-tipping"]
    elif any(k in desc_lower for k in ["e-waste", "electronic", "computer", "phone", "battery", "wire"]):
        category = "E-Waste"
        title = "Abandoned Electronic Components"
        severity = "High"
        impact = "Electronic components contain heavy metals like lead and mercury which can leach into groundwater, causing long-term chemical hazards."
        solutions = ["Coordinate with an authorized E-waste recycler", "Set up electronic collection days", "Educate community on hazardous household waste"]
    elif any(k in desc_lower for k in ["leak", "pipe", "burst", "water run", "sprinkler"]):
        category = "Water Leakage"
        title = "Active Water Pipe Leakage"
        severity = "Medium"
        impact = "Continuous water leakage wastes precious clean water, can erode surrounding ground foundations, and creates stagnant pools."
        solutions = ["Report to municipal utility department", "Replace the damaged joint or valve", "Implement pressure monitoring systems"]
    elif any(k in desc_lower for k in ["water pollution", "river", "lake", "pond", "dirty water", "algae"]):
        category = "Water Pollution"
        title = "Polluted Surface Water Body"
        severity = "Critical"
        impact = "Contamination of freshwater resources harms aquatic life, disrupts biological food chains, and poses serious health risks to nearby residents."
        solutions = ["Conduct water quality sampling", "Install filtration barriers", "Audit nearby runoffs to locate source of pollution"]
    elif any(k in desc_lower for k in ["air", "smoke", "smog", "factory", "fume"]):
        category = "Air Pollution"
        title = "Industrial Fumes Discharge"
        severity = "Critical"
        impact = "Suspended particulate matter and gaseous pollutants reduce air quality, aggravate respiratory illnesses, and contribute to acid rain."
        solutions = ["Report emissions level to environmental inspectors", "Install wet scrubbers on exhaust chimneys", "Increase local urban forest canopy cover"]
    elif any(k in desc_lower for k in ["burn", "fire", "smoke", "leaf burn"]):
        category = "Waste Burning"
        title = "Open-Air Waste Burning"
        severity = "High"
        impact = "Burning trash, especially plastics, releases toxic dioxins and heavy particulates directly into the local breathing zone, causing acute respiratory distress."
        solutions = ["Extinguish the burn pile immediately", "Enforce strict local fire regulations", "Introduce green waste composting alternatives"]
    elif any(k in desc_lower for k in ["sewage", "overflow", "drain", "stink", "manhole"]):
        category = "Sewage Overflow"
        title = "Overflowing Sewage Manhole"
        severity = "Critical"
        impact = "Raw sewage contains pathogenic bacteria and viruses that pose immediate public health hazards and contaminate local soil and drainage networks."
        solutions = ["Deploy municipal vacuum trucks to clear blockage", "Inspect sewer lines for structural collapse", "Sanitize the affected surface areas"]
    elif any(k in desc_lower for k in ["construction", "debris", "concrete", "brick", "cement"]):
        category = "Construction Waste"
        title = "Construction Debris Accumulation"
        severity = "Medium"
        impact = "Construction debris blocks pathways, creates safety hazards, and can wash fine sediments into storm drains, causing blockage."
        solutions = ["Enforce builder cleanup policies", "Divert masonry waste to crushing and recycling plants", "Install site containment fences"]
    elif any(k in desc_lower for k in ["deforestation", "tree", "forest", "cut", "logging"]):
        category = "Deforestation"
        title = "Unauthorized Tree Felling"
        severity = "High"
        impact = "Removing trees reduces local oxygen production, destroys wildlife habitats, increases soil erosion, and diminishes urban cooling effects."
        solutions = ["Cease logging operations pending permits", "Organize community tree planting events", "Establish protected municipal green spaces"]
    elif any(k in desc_lower for k in ["chemical", "oil", "grease", "industrial"]):
        category = "Chemical Waste"
        title = "Hazardous Chemical Spillage"
        severity = "Critical"
        impact = "Chemical spills present acute fire, toxic, or corrosive hazards to the soil and ecosystem, requiring specialized containment."
        solutions = ["Deploy professional spill response team", "Apply chemical neutralizers and absorbent booms", "Determine liability and enforce regulatory fines"]
    elif any(k in desc_lower for k in ["plant", "weed", "mosquito", "overgrown", "bush"]):
        category = "Vegetation Waste"
        title = "Overgrown Vegetation & Mosquito Breeding"
        severity = "High"
        impact = "Uncontrolled weed growth and accumulated plant waste trap moisture, creating ideal breeding grounds for disease-carrying mosquitoes and other pests."
        solutions = [
            "Create a DIY natural mosquito trap using an empty plastic bottle, yeast, and brown sugar placed near the plants.",
            "Convert the plant waste into free, nutrient-rich compost by simply piling it with dry leaves and soil.",
            "Sprinkle leftover coffee grounds or spray garlic water around the vegetation as a fast, natural insect repellent."
        ]
    else:
        category = "Other Environmental Issues"
        title = "Environmental Incident Reported"
        severity = "Low"
        impact = "General environmental issue requiring inspection. If left unaddressed, it may accumulate or aggravate local cleanliness standards."
        solutions = ["Deploy code enforcement officers to inspect site", "Encourage community vigilance", "Check for local resolution resources"]
        
    return {
        "title": title,
        "category": category,
        "severity": severity,
        "priority_score": severity, # matches severity in our simplified simulator
        "environmental_impact": impact,
        "recommended_solutions": solutions
    }

def _chat_simulated(user_message):
    msg_lower = user_message.lower()
    
    if "recycle" in msg_lower or "recycling" in msg_lower:
        return (
            "### Recycling Guidelines ♻️\n\n"
            "Recycling helps conserve resources and reduce landfill waste. Here are some basic tips:\n"
            "- **Clean first:** Rinse plastic containers, cans, and glass jars before recycling to prevent contamination.\n"
            "- **Know what to throw:** Paper, cardboard, clean aluminum cans, and plastics labeled #1 (PETE) and #2 (HDPE) are widely recyclable.\n"
            "- **Keep out:** Avoid recycling greasy pizza boxes, plastic bags, lightbulbs, or broken glass in standard bins."
        )
    elif "e-waste" in msg_lower or "electronic" in msg_lower or "battery" in msg_lower:
        return (
            "### E-Waste Handling 📱\n\n"
            "Electronic waste contains hazardous chemicals (lead, mercury, cadmium) and must never go in normal household trash.\n\n"
            "**How to dispose of E-Waste safely:**\n"
            "1. **Retailer Take-Backs:** Many electronics retailers accept old phones, computers, and chargers for free recycling.\n"
            "2. **Specialized Drop-offs:** Search for local hazardous waste collection events or dedicated E-waste recycling depots in your municipality.\n"
            "3. **Battery Bins:** Keep a box for batteries and drop them at designated retail collection points (often found in supermarkets)."
        )
    elif "water" in msg_lower or "leak" in msg_lower or "pollution" in msg_lower:
        return (
            "### Conserving & Protecting Water 💧\n\n"
            "Water is our most precious resource. Here is how you can help protect it:\n"
            "- **Report active leaks:** Use the EcoGuardian platform to report municipal pipe bursts or open sewer overflows immediately.\n"
            "- **Reduce runoff:** Avoid using synthetic fertilizers or pesticides right before rain, as they wash into storm drains and rivers.\n"
            "- **Conserve at home:** Fix leaky faucets immediately. A single leaking faucet can waste up to 3,000 gallons of water per year!"
        )
    elif "points" in msg_lower or "badge" in msg_lower or "rewards" in msg_lower:
        return (
            "### Community Rewards Program 🏆\n\n"
            "EcoGuardian AI rewards active citizens for participating in environmental cleanup and monitoring:\n"
            "- **Submit a report:** +50 Green Points\n"
            "- **Resolve an issue:** +100 Green Points (requires uploading a resolution picture)\n"
            "- **Earn Badges:** Unlock badges like **Eco Sentinel** (your first report), **Plastbuster** (reporting plastic waste), or **Zero Waste Hero** (resolving an issue)!\n\n"
            "Points determine your place on the local Leaderboard. Check the Rewards page in the app to see your standing!"
        )
    elif "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
        return (
            "Hello! I am **EcoBot**, your sustainability advisor. 🌍\n\n"
            "I can help you with:\n"
            "- Recycling tips & waste management\n"
            "- Environmental issue reporting guidelines\n"
            "- Eco Guardian community rewards\n"
            "- General conservation guidance\n\n"
            "What environmental question can I answer for you today?"
        )
    else:
        return (
            "Thank you for reaching out! 🌿 As **EcoBot**, I am here to help you live more sustainably. "
            "To clean our planet, remember that every small effort matters - whether it's reducing single-use plastic, "
            "recycling correctly, or reporting a local waste problem. "
            "Feel free to ask me about recycling, e-waste, water conservation, or our rewards system!"
        )
