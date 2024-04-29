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

# last task for python - do the bot string if js requests
@app.route('/')
def index():
    return render_template('index.html')

class comapp(com.bot):
    # here for debug
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
        loop.run_until_complete(bot.doplay(data))
    except Exception:
        anysocketexce()


@socketio.event
def startweb():
    global bot
    try:
        print("startweb")
        bot = comapp(None)
    except Exception:
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
