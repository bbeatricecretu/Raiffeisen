# Makefile for managing the Raiffeisen SmartToken AI project

.PHONY: install start-backend start-frontend clean

# Install dependencies for both backend and frontend
install:
	@echo "Installing Backend dependencies..."
	cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	@echo "Installing Frontend dependencies..."
	cd frontend && npm install

# Start the Python Backend API
start-backend:
	@echo "Starting Backend on http://localhost:8000..."
	cd backend && source .venv/bin/activate && python3 -m src.main

# Start the React Frontend
start-frontend:
	@echo "Starting Frontend on http://localhost:5173..."
	cd frontend && npm run dev

# Run both backend and frontend simultaneously using concurrently (requires Node.js)
start:
	@echo "Starting both services..."
	cd frontend && npx concurrently --kill-others-on-fail -n "API,APP" -c "blue,magenta" \
		"cd ../backend && .venv/bin/python3 -m src.main" \
		"npm run dev"

# Old instructions
dev-help:
	@echo "To run manually in separate terminals:"
	@echo "  1. make start-backend"
	@echo "  2. make start-frontend"
