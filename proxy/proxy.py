from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GRAPHDB_URL = "http://localhost:7200/repositories/Projet"

@app.route("/sparql")
def sparql():
    query = request.args.get("query")
    response = requests.get(GRAPHDB_URL, params={"query": query})

    return jsonify({"results_raw": response.text})

if __name__ == "__main__":
    app.run(port=3000)