import eventlet

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
                emit('move', {"num": j + i * 14, "x": 40 * j, "y": 100 + i * 90})

    except Exception:
        print("execption")

@socketio.event
def moveele(message):
    try:

        print(f"move {message}")
        #if (message["target"] != "as"):
        #            emit('addcard', {"data": "add", "num": 0})

        #emit('move', {"data": "MOVE", "id": "as", "x": 50, "y": 50})

    except Exception:
        print("execption")
        anysocketexce()


@app.route('/alt')
def alt():
    return render_template('alt.html')


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
