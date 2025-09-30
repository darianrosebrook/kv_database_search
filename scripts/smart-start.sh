#!/bin/bash
# Description: Smart server startup script with dynamic port management
# This script provides intelligent server management similar to kokoro project
# @author @darianrosebrook

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :${port} >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        print_warning "Port $port is in use by $service_name. Attempting to free it..."
        
        # Get PIDs using the port
        local pids=$(lsof -t -i:$port 2>/dev/null || true)
        
        if [ -n "$pids" ]; then
            for pid in $pids; do
                print_status "Killing process $pid on port $port..."
                kill -9 $pid 2>/dev/null || true
            done
            
            # Wait for port to be released
            local attempts=0
            while [ $attempts -lt 10 ] && check_port $port; do
                sleep 0.5
                attempts=$((attempts + 1))
            done
            
            if check_port $port; then
                print_error "Failed to free port $port after 5 seconds"
                return 1
            else
                print_success "Port $port is now free"
            fi
        fi
    fi
    
    return 0
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local max_attempts=10
    local port=$start_port
    
    for ((i=0; i<max_attempts; i++)); do
        if ! check_port $port; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    print_error "No available ports found starting from $start_port"
    return 1
}

# Function to start server with port management
start_server() {
    local server_name=$1
    local default_port=$2
    local script_path=$3
    local watch_mode=${4:-false}
    local force_kill=${5:-false}
    
    print_status "Starting $server_name server..."
    
    # Check if server is already running
    local existing_pid=""
    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        existing_pid=$(jq -r ".\"$server_name\" // empty" "$PROJECT_ROOT/.server.pid" 2>/dev/null || echo "")
    fi
    
    if [ -n "$existing_pid" ] && kill -0 $existing_pid 2>/dev/null; then
        if [ "$force_kill" = "true" ]; then
            print_warning "Force killing existing $server_name server (PID: $existing_pid)..."
            kill -9 $existing_pid 2>/dev/null || true
            # Remove from PID file
            jq "del(.\"$server_name\")" "$PROJECT_ROOT/.server.pid" > "$PROJECT_ROOT/.server.pid.tmp" 2>/dev/null && \
            mv "$PROJECT_ROOT/.server.pid.tmp" "$PROJECT_ROOT/.server.pid" 2>/dev/null || true
        else
            print_warning "$server_name server is already running (PID: $existing_pid)"
            print_status "Use --force to kill and restart"
            return 0
        fi
    fi
    
    # Determine target port
    local target_port=$default_port
    
    if check_port $target_port; then
        if [ "$force_kill" = "true" ]; then
            kill_port_processes $target_port "existing service"
        else
            print_warning "Port $target_port is in use, finding alternative..."
            target_port=$(find_available_port $((default_port + 1)))
            if [ $? -ne 0 ]; then
                print_error "Failed to find available port"
                return 1
            fi
            print_success "Using port $target_port"
        fi
    fi
    
    # Start the server
    print_status "Starting server on port $target_port..."
    
    local server_pid=""
    if [ "$watch_mode" = "true" ]; then
        PORT=$target_port tsx watch "$script_path" > "$LOG_DIR/$server_name.log" 2>&1 &
        server_pid=$!
    else
        PORT=$target_port tsx "$script_path" > "$LOG_DIR/$server_name.log" 2>&1 &
        server_pid=$!
    fi
    
    # Store PID
    local pid_data="{}"
    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        pid_data=$(cat "$PROJECT_ROOT/.server.pid" 2>/dev/null || echo "{}")
    fi
    echo "$pid_data" | jq ". + {\"$server_name\": $server_pid}" > "$PROJECT_ROOT/.server.pid"
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    sleep 3
    
    # Check if server is still running
    if ! kill -0 $server_pid 2>/dev/null; then
        print_error "Server failed to start. Check $LOG_DIR/$server_name.log for details"
        return 1
    fi
    
    # Health check
    local health_url="http://localhost:$target_port/health"
    local health_attempts=0
    local max_health_attempts=20
    
    while [ $health_attempts -lt $max_health_attempts ]; do
        if curl -s "$health_url" >/dev/null 2>&1; then
            print_success "$server_name server started successfully!"
            print_success "  Port: $target_port"
            print_success "  PID: $server_pid"
            print_success "  Health: $health_url"
            print_success "  Logs: $LOG_DIR/$server_name.log"
            return 0
        fi
        sleep 0.5
        health_attempts=$((health_attempts + 1))
    done
    
    print_warning "Health check failed, but server may still be starting..."
    print_success "$server_name server started (PID: $server_pid, Port: $target_port)"
    return 0
}

# Function to stop server
stop_server() {
    local server_name=$1
    
    if [ ! -f "$PROJECT_ROOT/.server.pid" ]; then
        print_warning "No PID file found"
        return 0
    fi
    
    local pid=$(jq -r ".\"$server_name\" // empty" "$PROJECT_ROOT/.server.pid" 2>/dev/null || echo "")
    
    if [ -z "$pid" ] || [ "$pid" = "null" ]; then
        print_warning "No stored PID for $server_name"
        return 0
    fi
    
    if ! kill -0 $pid 2>/dev/null; then
        print_warning "Process $pid is not running"
        # Clean up PID file
        jq "del(.\"$server_name\")" "$PROJECT_ROOT/.server.pid" > "$PROJECT_ROOT/.server.pid.tmp" 2>/dev/null && \
        mv "$PROJECT_ROOT/.server.pid.tmp" "$PROJECT_ROOT/.server.pid" 2>/dev/null || true
        return 0
    fi
    
    print_status "Stopping $server_name server (PID: $pid)..."
    kill -9 $pid 2>/dev/null || true
    
    # Remove from PID file
    jq "del(.\"$server_name\")" "$PROJECT_ROOT/.server.pid" > "$PROJECT_ROOT/.server.pid.tmp" 2>/dev/null && \
    mv "$PROJECT_ROOT/.server.pid.tmp" "$PROJECT_ROOT/.server.pid" 2>/dev/null || true
    
    print_success "$server_name server stopped"
}

# Function to list running servers
list_servers() {
    print_status "Server Status:"
    echo "================"
    
    if [ ! -f "$PROJECT_ROOT/.server.pid" ]; then
        print_warning "No servers running"
        return 0
    fi
    
    local servers=("kv-database" "graph-rag" "rag-editor")
    
    for server in "${servers[@]}"; do
        local pid=$(jq -r ".\"$server\" // empty" "$PROJECT_ROOT/.server.pid" 2>/dev/null || echo "")
        
        if [ -n "$pid" ] && [ "$pid" != "null" ] && kill -0 $pid 2>/dev/null; then
            # Find the port this server is using
            local port_info=""
            case $server in
                "kv-database")
                    port_info=$(lsof -i :3001 -P 2>/dev/null | grep ":$pid" | head -1 | awk '{print $9}' | cut -d: -f2)
                    ;;
                "graph-rag")
                    port_info=$(lsof -i :3002 -P 2>/dev/null | grep ":$pid" | head -1 | awk '{print $9}' | cut -d: -f2)
                    ;;
                "rag-editor")
                    port_info=$(lsof -i :3000 -P 2>/dev/null | grep ":$pid" | head -1 | awk '{print $9}' | cut -d: -f2)
                    ;;
            esac
            print_success "$server: Running (PID: $pid, Port: ${port_info:-unknown})"
        else
            print_warning "$server: Stopped"
        fi
    done
}

# Function to cleanup all servers
cleanup_all() {
    print_status "Cleaning up all servers..."
    
    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        local servers=("kv-database" "graph-rag" "rag-editor")
        
        for server in "${servers[@]}"; do
            stop_server "$server"
        done
        
        rm -f "$PROJECT_ROOT/.server.pid"
    fi
    
    print_success "Cleanup complete"
}

# Main script logic
case "${1:-help}" in
    "start")
        server_name=${2:-"kv-database"}
        force_kill=${3:-"false"}
        watch_mode=${4:-"false"}
        
        case $server_name in
            "kv-database")
                start_server "kv-database" 3001 "apps/kv_database/src/server.ts" "$watch_mode" "$force_kill"
                ;;
            "graph-rag")
                start_server "graph-rag" 3002 "apps/kv_database/src/graph-rag-server.ts" "$watch_mode" "$force_kill"
                ;;
            "rag-editor")
                start_server "rag-editor" 3000 "apps/rag_editor" "$watch_mode" "$force_kill"
                ;;
            *)
                print_error "Unknown server: $server_name"
                print_status "Available servers: kv-database, graph-rag, rag-editor"
                exit 1
                ;;
        esac
        ;;
    
    "stop")
        server_name=${2:-"all"}
        
        if [ "$server_name" = "all" ]; then
            cleanup_all
        else
            stop_server "$server_name"
        fi
        ;;
    
    "list")
        list_servers
        ;;
    
    "cleanup")
        cleanup_all
        ;;
    
    "help"|*)
        echo "🔧 Obsidian RAG Smart Server Manager"
        echo ""
        echo "Usage:"
        echo "  $0 start <server> [force] [watch]"
        echo "  $0 stop <server|all>"
        echo "  $0 list"
        echo "  $0 cleanup"
        echo ""
        echo "Servers:"
        echo "  kv-database  - Main KV database server (port 3001)"
        echo "  graph-rag    - Graph RAG server (port 3002)"
        echo "  rag-editor    - RAG editor frontend (port 3000)"
        echo ""
        echo "Options:"
        echo "  force        - Force kill existing processes"
        echo "  watch        - Enable watch mode for development"
        echo ""
        echo "Examples:"
        echo "  $0 start kv-database"
        echo "  $0 start kv-database force watch"
        echo "  $0 stop kv-database"
        echo "  $0 list"
        ;;
esac
