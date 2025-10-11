from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Configuration
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
app.config['PORT'] = int(os.getenv('FLASK_PORT', '4300'))

# Sample data
agents = [
    {
        "id": 1,
        "name": "Assistant Agent",
        "type": "general",
        "status": "active",
        "description": "A general-purpose assistant agent"
    },
    {
        "id": 2,
        "name": "Data Agent",
        "type": "data",
        "status": "active",
        "description": "Specialized in data processing and analysis"
    },
    {
        "id": 3,
        "name": "API Agent",
        "type": "api",
        "status": "inactive",
        "description": "Handles API integrations and external services"
    }
]

# Routes
@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        "message": "Agents API is running!",
        "version": "1.0.0",
        "endpoints": {
            "GET /agents": "Get all agents",
            "GET /agents/<id>": "Get agent by ID",
            "POST /agents": "Create new agent",
            "PUT /agents/<id>": "Update agent",
            "DELETE /agents/<id>": "Delete agent",
            "GET /health": "Health check"
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "agents-api",
        "timestamp": "2024-01-01T00:00:00Z"
    })

@app.route('/agents', methods=['GET'])
def get_agents():
    """Get all agents"""
    return jsonify({
        "agents": agents,
        "count": len(agents)
    })

@app.route('/agents/<int:agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get agent by ID"""
    agent = next((a for a in agents if a['id'] == agent_id), None)
    if agent:
        return jsonify(agent)
    return jsonify({"error": "Agent not found"}), 404

@app.route('/agents', methods=['POST'])
def create_agent():
    """Create a new agent"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    # Generate new ID
    new_id = max([a['id'] for a in agents]) + 1 if agents else 1
    
    new_agent = {
        "id": new_id,
        "name": data['name'],
        "type": data.get('type', 'general'),
        "status": data.get('status', 'active'),
        "description": data.get('description', '')
    }
    
    agents.append(new_agent)
    return jsonify(new_agent), 201

@app.route('/agents/<int:agent_id>', methods=['PUT'])
def update_agent(agent_id):
    """Update an existing agent"""
    agent = next((a for a in agents if a['id'] == agent_id), None)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update agent fields
    for key, value in data.items():
        if key in agent and key != 'id':  # Don't allow ID changes
            agent[key] = value
    
    return jsonify(agent)

@app.route('/agents/<int:agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    """Delete an agent"""
    global agents
    agent = next((a for a in agents if a['id'] == agent_id), None)
    if not agent:
        return jsonify({"error": "Agent not found"}), 404
    
    agents = [a for a in agents if a['id'] != agent_id]
    return jsonify({"message": "Agent deleted successfully"})

@app.route('/agents/type/<agent_type>', methods=['GET'])
def get_agents_by_type(agent_type):
    """Get agents by type"""
    filtered_agents = [a for a in agents if a['type'] == agent_type]
    return jsonify({
        "agents": filtered_agents,
        "count": len(filtered_agents),
        "type": agent_type
    })

if __name__ == '__main__':
    port = app.config['PORT']
    debug = app.config['DEBUG']
    print(f"Starting Agents API on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
