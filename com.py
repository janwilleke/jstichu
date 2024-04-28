import asyncio
import websockets
import json
import sys


class player:
    def __init__(self, websocket):
        self.ws = websocket

    async def send_command(self, command, opts={}):
        h = {'command': command}
        h.update(opts)
        print(f"sending ===> {h}")
        await self.ws.send(json.dumps(h))


class bot(player):
    def __init__(self, websocket):
        super(bot, self).__init__(websocket)
        self.condition = None

    async def doplay(self, data):
        print("<=<= received game state")
        print(data.get('players')[0])
        print(f'state: {data.get("state")} turn {data.get("turn")}')
        print(f"fertig geschoben: {not not data.get('players')[0].get('passed_cards')}")
        if self.condition is not None:
            print(self.condition(data))
        else:
            print("condition is NULL")
        print("--------------")

        if data.get('state') == 'over':
            print("its all over baby blue")
            exit()
        if data.get('error'):
            print(data.get('error'))
            exit()

        if self.condition is not None:
            if self.condition(data):
                self.condition = None
            else:
                print("...")
                return

        if data.get('state') == 'ready':
            if data.get('dealer') == 0:
                await self.send_command('deal')
                self.condition = lambda data: data.get('state') != 'ready'
        elif data.get('state') == 'passing':
            if data.get('players')[0].get('hand_size') == 8:
                await self.send_command('back6')
                self.condition = lambda data: data.get('players')[0].get('hand_size') == 14
            elif not data.get('players')[0].get('passed_cards'):
                await self.send_command('pass_cards', {'cards': data.get('players')[0].get('hand')[0:3]});
                self.condition = lambda data: data.get('turn') != None
        elif data.get('state') == 'playing':
            if data.get('turn') == 0:
                plays = list(data.get('players')[0].get('possible_plays').keys())
                print(f'possible plays {plays}')
                play = plays[0]  # so ist das eher defensiv - ich passe wenn es geht ;-) - das orginal spielt zufall
                print(f'possible play {play}')
                wish_rank = '7' if '1' in play else None
                await self.send_command('play', {'cards': play, 'wish_rank': wish_rank});
                if (play == '0' and data.get('players')[3].get('hand_size') == 0 and data.get('players')[2].get('hand_size') == 0):
                    print("played dog")
                else:
                    self.condition = lambda data: data.get('turn') != 0
            if data.get('turn') is None and data.get('trick_winner') == 0:
                await self.send_command('claim', {'to_player': 1 if data.get('dragon_trick') else 0});
                self.condition = lambda data: data.get('turn') is not None
        elif data.get('state') == 'over':
            await self.ws.close()


class consolebot(bot):
    async def send_command(self, command, opts={}):
        h = {'command': command}
        h.update(opts)
        print(f"sending CON ===> {h}")
        x = sys.stdin.readline().strip()
        print(f'x-{x}- len{len(x)}')
        if (len(x) > 0):
            h['cards'] = x
        print(f"sending user ===> {h}")

        await self.ws.send(json.dumps(h))


async def receive_json_messages(player_id="test"):
    uri = f"ws://localhost:9292/connect?game_id=TESTI&player_id={player_id}"
    async with websockets.connect(uri) as websocket:
        lock = asyncio.Lock()
        if player_id == "test":
            mybot = bot(websocket)
        else:
            mybot = consolebot(websocket)
        while True:
            message = await websocket.recv()
            try:
                # Attempt to parse the message as JSON
                json_message = json.loads(message)
                async with lock:
                    await mybot.doplay(json_message)
                #print(json_message)
            except json.JSONDecodeError:
                print(f"Received non-JSON message: {message}")

# Run the async function
if __name__ == '__main__':
    print(sys.argv[1])
    asyncio.get_event_loop().run_until_complete(receive_json_messages(sys.argv[1]))
