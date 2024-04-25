from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/drag_event', methods=['POST'])
def drag_event():
    data = request.json
    print(f"Drag event received: {data}")
    # Here you can handle the drag event, e.g., update a database or perform some action
    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=True)
