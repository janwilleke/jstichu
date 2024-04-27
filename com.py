import asyncio
import websockets
import json

async def send_command(websocket, command, opts=None):
    if opts is None:
        opts = {}
    h = {'command': command}
    h.update(opts)
    print("sending ===>")
    print(h)
    await websocket.send(json.dumps(h))


async def doplay(ws, data):
    condition = None
    print("<=<= received game state")
    print(data)

    if data.get('error'):
        exit()

    if data.get('state') == 'ready':
        if data.get('dealer') == 0:
            await send_command(ws,'deal')
            condition = lambda data: data.get('state') != 'ready'
    elif data.get('state') == 'passing':
        if data.get('players')[0].get('hand_size') == 8:
            await send_command(ws, 'back6')
            condition = lambda data: data.get('players')[0].get('hand_size') == 14
        elif not data.get('players')[0].get('passed_cards'):
            await send_command(ws, 'pass_cards', {'cards': data.get('players')[0].get('hand')[0:3]});
            condition = lambda data: not data.get('players')[0].get('passed_cards')
    elif data.get('state') == 'playing':
        if data.get('turn') == 0:
            plays = list(data.get('players')[0].get('possible_plays').keys())
            play = plays[0] # Assuming sample() is not directly available for keys
            wish_rank = '7' if '1' in play else None
            await send_command(ws, 'play', {'cards': play, 'wish_rank': wish_rank});
            condition = lambda data: data.get('turn') != 0
        if data.get('turn') is None and data.get('trick_winner') == 0:
            await send_command(ws, 'claim', {'to_player': 1 if data.get('dragon_trick') else 0});
            condition = lambda data: data.get('turn') is not None
    elif data.get('state') == 'over':
        await ws.close()

async def receive_json_messages():
    uri = "ws://localhost:9292/connect?game_id=TESTI&player_id=7ZELP"
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            try:
                # Attempt to parse the message as JSON
                json_message = json.loads(message)
                await doplay(websocket, json_message)
                #print(json_message)
            except json.JSONDecodeError:
                print(f"Received non-JSON message: {message}")

# Run the async function
asyncio.get_event_loop().run_until_complete(receive_json_messages())
