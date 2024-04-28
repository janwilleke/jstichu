import asyncio
import eventlet
import traceback
import com
import json
import sys

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room, \
    close_room, rooms, disconnect

async_mode = "eventlet"

app = Flask(__name__)
socketio = SocketIO(app, async_mode=async_mode)
loop = asyncio.get_event_loop()

@app.route('/')
def index():
    return render_template('index.html')

class comapp(com.bot):
    # here for debug
    async def send_command_consol(self, command, opts={}):
        h = {'command': command}
        h.update(opts)
        print(f"sending ===> {h}")
        x = sys.stdin.readline().strip()
        print(f'x-{x}- len{len(x)}')
        if (len(x) > 0):
            h['cards'] = x
        print(f"sending user ===> {h}")
        socketio.emit("toclient", json.dumps(h))
    async def send_command(self, command, opts={}):
        h = {'command': command}
        h.update(opts)
        print(f"bot wands sending ===> {h}")
        socketio.emit("bottext", {"text": json.dumps(h)})
bot = None

@socketio.event
def client(message):
    try:

        data = json.loads(message)
        # print(data)
        anzahl = data.get('players')[0].get('hand_size')
        hand = data.get('players')[0].get('hand')
        print(f'anzahl {anzahl} hand: {hand}')
        i = 0
        for ch in hand:
            x = ord(ch) - ord('0')
            print(f'char: {x}')
            emit('addcard', {"num": x})
            emit('move', {"num": x, "x": i, "y": 100})
            i += 50
        loop.run_until_complete(bot.doplay(data))
        # await bot.doplay(message)
    except Exception:
        anysocketexce()


@socketio.event
def startweb():
    global bot
    try:
        print("startweb")
        bot = comapp(None)

        #for i in range(0, 4):
        #    for j in range(0, 14):
        #        emit('addcard', {"num": j + i * 14 })
        #        emit('move', {"num": j + i * 14, "x": 50 * j, "y": 100 + i * 90})

    except Exception:
        anysocketexce()

@socketio.event
def moveele(message):
    try:
        print(f"move {message}")

    except Exception:
        print("execption")
        anysocketexce()
@socketio.event
def pressed(message):
    try:
        print(f"pressed {message}")
        card = message["card"][4]
        x = message["x"]
        y = message["y"]
        print(f"num {card} x {x} y {y}")
        emit('move', {"num": int(card), "x": int(x), "y": int(y) - 10})

    except Exception:
        print("execption")
        anysocketexce()


def anysocketexce():
    print("exception print start")
    exce = traceback.format_exc()
    print(exce)
    #emit('logmsg', {"data" : exce})
    print("exceotion print end")
    #emit('logmsg', {"data" : "EXCEPTION -> Disconnect"})
    #disconnect()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
