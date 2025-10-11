# Agents Flask API

A simple Flask REST API for managing agents.

## Features

- RESTful API endpoints for CRUD operations on agents
- CORS enabled for frontend integration
- Environment-based configuration
- Health check endpoint
- Sample data included

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:4300`

## API Endpoints

### Base Information
- `GET /` - API information and available endpoints
- `GET /health` - Health check

### Agents
- `GET /agents` - Get all agents
- `GET /agents/<id>` - Get agent by ID
- `POST /agents` - Create new agent
- `PUT /agents/<id>` - Update agent
- `DELETE /agents/<id>` - Delete agent
- `GET /agents/type/<type>` - Get agents by type

## Example Usage

### Get all agents
```bash
curl http://localhost:4300/agents
```

### Create a new agent
```bash
curl -X POST http://localhost:4300/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Agent",
    "type": "custom",
    "description": "A custom agent"
  }'
```

### Update an agent
```bash
curl -X PUT http://localhost:4300/agents/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

## Production Deployment

For production, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:4300 app:app
```

## Development

The application includes:
- Flask development server with auto-reload
- CORS support for frontend development
- Environment-based configuration
- Sample data for testing

## Project Structure

```
agents/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env.example       # Environment variables template
└── README.md          # This file
```
