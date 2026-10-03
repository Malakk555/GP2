from flask import Flask, request, jsonify
from flask_cors import CORS

from process_all_games import (
    analyze_single_comment,
    update_game_with_single_comment
)

app = Flask(__name__)
CORS(app)


@app.route("/analyze-comment", methods=["POST"])
def analyze_comment():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Missing request data."
        }), 400

    game_id = data.get("game_id")
    comment = data.get("comment", "")

    if not game_id:
        return jsonify({
            "success": False,
            "message": "Missing game_id."
        }), 400

    prediction = analyze_single_comment(comment)

    if prediction is None:
        return jsonify({
            "success": False,
            "message": "Invalid comment."
        }), 400

    try:
        result = update_game_with_single_comment(
            int(game_id),
            prediction
        )

        return jsonify({
            "success": True,
            "message": "Comment analyzed successfully.",
            "prediction": prediction,
            "result": result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )