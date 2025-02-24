import asyncio
import websockets
import openai
import json

# OpenAI API Key
openai.api_key = ""
async def chat_with_gpt(user_input):
    """ Fetch response from GPT-4 Turbo """
    response = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": user_input}],
        stream=False  # No streaming, send full response
    )
    return response["choices"][0]["message"]["content"]

async def websocket_handler(websocket, path):
    """ Handle WebSocket messages """
    async for message in websocket:
        data = json.loads(message)

        if data.get("type") == "user_input":
            user_text = data["content"]
            print(f"Received from user: {user_text}")

            # Get GPT response
            bot_reply = await chat_with_gpt(user_text)
            print(f"GPT Reply: {bot_reply}")

            # Send GPT response back to JavaScript
            await websocket.send(json.dumps({"type": "bot_response", "content": bot_reply}))

# Start WebSocket Server
async def start_server():
    async with websockets.serve(websocket_handler, "localhost", 8765):
        await asyncio.Future()  # Keep server running

asyncio.run(start_server())

