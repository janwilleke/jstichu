import eventlet
import traceback
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room, \
    close_room, rooms, disconnect

async_mode = "eventlet"

app = Flask(__name__)
socketio = SocketIO(app, async_mode=async_mode)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.event
def startweb():
    try:
        print("startweb")
        for i in range(0, 4):
            for j in range(0, 14):
                emit('addcard', {"num": j + i * 14 })
                emit('move', {"num": j + i * 14, "x": 50 * j, "y": 100 + i * 90})

    except Exception:
        print("execption")

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
