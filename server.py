from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    data = request.get_json()
    user_message = data.get('messages', [])[-1].get('content', '') if data.get('messages') else ''

    # Mock response
    response = {
        "choices": [
            {
                "message": {
                    "content": f"Hello! You said: '{user_message}'. This is a mock response from Llama AI."
                }
            }
        ]
    }
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8321)
