#!/usr/bin/env bash
#
# setup-ollama.sh — Detect GPU, install Ollama, pull a model, verify.
# Idempotent: skips steps that are already done.
#
set -euo pipefail

# ---------- helpers ----------
info()  { printf '\033[0;32m[INFO]\033[0m  %s\n' "$*"; }
warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$*"; }
error() { printf '\033[0;31m[ERROR]\033[0m %s\n' "$*"; }

# ---------- GPU detection ----------
detect_gpu() {
  if command -v nvidia-smi &>/dev/null && nvidia-smi &>/dev/null; then
    echo "nvidia"
  elif [ -d /sys/class/drm ] && ls /sys/class/drm/card*/device/vendor 2>/dev/null | xargs grep -ql '0x1002' 2>/dev/null; then
    echo "amd"
  elif [ "$(uname)" = "Darwin" ]; then
    echo "apple"  # Apple Silicon / Metal
  else
    echo "cpu"
  fi
}

GPU=$(detect_gpu)
info "Detected GPU: $GPU"

# ---------- Choose model based on GPU ----------
case "$GPU" in
  nvidia|amd|apple)
    # GPU available — use a larger MoE model
    MODEL="${OLLAMA_MODEL:-qwen3:1.7b}"
    info "GPU detected — defaulting to model: $MODEL"
    info "For better results, set OLLAMA_MODEL=qwen3.5:35b-a3b"
    ;;
  *)
    # CPU only — use the smallest capable model
    MODEL="${OLLAMA_MODEL:-qwen3:1.7b}"
    warn "No GPU detected — using smallest model: $MODEL"
    warn "Agent responses will be slow (~90s each). A GPU is recommended."
    ;;
esac

# ---------- Install Ollama if missing ----------
if command -v ollama &>/dev/null; then
  info "Ollama already installed: $(ollama --version 2>/dev/null || echo 'unknown version')"
else
  info "Installing Ollama..."
  if [ "$(uname)" = "Darwin" ]; then
    if command -v brew &>/dev/null; then
      brew install ollama
    else
      error "Please install Ollama from https://ollama.com/download"
      exit 1
    fi
  elif [ "$(uname)" = "Linux" ]; then
    curl -fsSL https://ollama.com/install.sh | sh
  else
    error "Unsupported OS. Install Ollama from https://ollama.com/download"
    exit 1
  fi
  info "Ollama installed successfully"
fi

# ---------- Start Ollama if not running ----------
if curl -sf http://127.0.0.1:11434/api/tags &>/dev/null; then
  info "Ollama is already running"
else
  info "Starting Ollama server..."
  ollama serve &>/dev/null &
  OLLAMA_PID=$!
  # Wait for startup (max 15s)
  for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:11434/api/tags &>/dev/null; then
      info "Ollama server started (pid $OLLAMA_PID)"
      break
    fi
    sleep 1
  done
  if ! curl -sf http://127.0.0.1:11434/api/tags &>/dev/null; then
    error "Ollama failed to start within 15 seconds"
    exit 1
  fi
fi

# ---------- Pull model if not already available ----------
EXISTING=$(curl -sf http://127.0.0.1:11434/api/tags | grep -o "\"$MODEL" || true)
if [ -n "$EXISTING" ]; then
  info "Model '$MODEL' already pulled"
else
  info "Pulling model '$MODEL' (this may take a while)..."
  ollama pull "$MODEL"
  info "Model '$MODEL' pulled successfully"
fi

# ---------- Verify ----------
info ""
info "=== Verification ==="
info "Ollama:  $(curl -sf http://127.0.0.1:11434/api/tags | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\"models\",[]))} model(s) available')" 2>/dev/null || echo 'running')"
info "Model:   $MODEL"
info "GPU:     $GPU"
info ""
info "WorldView agent swarm is ready. Start the app with: npm run dev"
