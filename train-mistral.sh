#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LLM_DIR="${SCRIPT_DIR}/../dirac-llm"
MODELS_BASE="${LLM_DIR}/mlx/llm_models"
STATE_FILE="${MODELS_BASE}/.current"
SERVER_LOG="${LLM_DIR}/mlx/server.log"

# Determine current active slot (A or B)
if [[ -f "$STATE_FILE" ]]; then
	current_slot=$(cat "$STATE_FILE")
else
	current_slot="B"  # Default: start with B as current, so first train goes to A
fi

# Determine which slot to train into (the inactive one)
if [[ "$current_slot" == "A" ]]; then
	new_slot="B"
else
	new_slot="A"
fi

NEW_MODEL_DIR="${MODELS_BASE}/model_extended_${new_slot}"
echo "Current active model: model_extended_${current_slot}"
echo "Training new model into: model_extended_${new_slot}"
echo ""

cd "$LLM_DIR"
source .venv/bin/activate
cd mlx

# Train with the new slot directory
MODEL_OUTPUT_DIR="$NEW_MODEL_DIR" ./lora_train_balanced_fresh.sh

# Verify the new model was created successfully
if [[ ! -f "${NEW_MODEL_DIR}/config.json" ]]; then
	echo "Error: Training completed but model directory is incomplete: ${NEW_MODEL_DIR}"
	exit 1
fi

echo ""
echo "Training successful! Switching server to new model..."

# Stop the old server (kill whatever is on port 5001)
echo "Stopping old server..."
old_pid=$(lsof -ti :5001 2>/dev/null || true)
if [[ -n "$old_pid" ]]; then
	kill "$old_pid" 2>/dev/null || true
	sleep 2
	# Force kill if still running
	if kill -0 "$old_pid" 2>/dev/null; then
		kill -9 "$old_pid" 2>/dev/null || true
		sleep 1
	fi
	echo "Old server stopped (PID $old_pid)"
else
	echo "No server was running on port 5001"
fi

# Start server with new model
echo "Starting new server with model: $NEW_MODEL_DIR"
cd "$LLM_DIR"
MLX_MODEL_PATH="$NEW_MODEL_DIR" nohup .venv/bin/python mlx/python_script/stateless_chat_server_train.py > "$SERVER_LOG" 2>&1 &
new_pid=$!

# Update state file to mark new slot as active
echo "$new_slot" > "$STATE_FILE"

echo ""
echo "=" | head -c 60; echo
echo "Training complete!"
echo "New model: model_extended_${new_slot}"
echo "Old model: model_extended_${current_slot} (kept for rollback)"
echo "Server restarted on port 5001 (PID $new_pid)"
echo "Server log: $SERVER_LOG"
echo "=" | head -c 60; echo
