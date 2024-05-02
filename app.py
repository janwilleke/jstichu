import asyncio
import eventlet
import traceback
import com
import json
import sys
import requests

from flask_cors import CORS
from flask import Flask, render_template, request, jsonify

async_mode = "eventlet"

app = Flask(__name__)
loop = asyncio.get_event_loop()

CORS(app)

# last task for python - do the bot string if js requests
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new', methods=['POST'])
def new():
    print(request.get_json())
    response = requests.post("http://localhost:9292/new",
                             data="name=Peter&end_score=1000")
    print(response.text)
    return response.text



if __name__ == '__main__':
    app.run(host='0.0.0.0')
