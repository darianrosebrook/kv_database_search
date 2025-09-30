# Smart Port Management System

This directory contains intelligent port management tools for the Obsidian RAG project, inspired by the kokoro project's dynamic port checking and process management.

## Features

- **Dynamic Port Detection**: Automatically finds available ports when conflicts occur
- **Process Management**: Tracks and manages server processes with PID files
- **Force Kill Capability**: Can forcefully terminate conflicting processes
- **Health Checking**: Monitors server startup and health endpoints
- **Multiple Interfaces**: Both shell script and TypeScript implementations

## Quick Start

### Using Smart Shell Scripts (Recommended)

```bash
# Start KV database server (with automatic port management)
npm run smart:start:kv

# Start with force kill if port is in use
npm run smart:start:force

# Start with watch mode for development
npm run smart:start:watch

# List all running servers
npm run smart:list

# Stop a specific server
npm run smart:stop:kv

# Clean up all servers
npm run smart:cleanup
```

### Using TypeScript Port Manager

```bash
# Start a server
npm run port:start kv-database

# Start with force kill
npm run port:start kv-database --force

# Start with watch mode
npm run port:start kv-database --watch

# List servers
npm run port:list

# Stop a server
npm run port:stop kv-database

# Clean up all
npm run port:cleanup
```

## Available Servers

| Server | Default Port | Description |
|--------|-------------|-------------|
| `kv-database` | 3001 | Main KV database server |
| `graph-rag` | 3002 | Graph RAG server |
| `rag-editor` | 3000 | RAG editor frontend |

## Smart Features

### Automatic Port Resolution
- If the default port is in use, the system automatically finds the next available port
- Fallback ports: 3002, 3003, 3004, 3005 for kv-database
- Process tracking ensures no duplicate servers

### Force Kill Mode
- `--force` flag kills existing processes on the target port
- Useful for development when you want to restart a server
- Automatically cleans up PID files

### Health Monitoring
- Waits for server startup (configurable timeout)
- Health checks via `/health` endpoint
- Graceful error handling and reporting

### Process Tracking
- PID files (`.server.pid`) track running servers
- Automatic cleanup on server stop
- Prevents duplicate server instances

## Configuration

### Environment Variables
- `PORT`: Override default port for a server
- `HOST`: Server host (default: localhost)
- `LOG_LEVEL`: Logging level for servers

### Server Configuration
Each server has configurable:
- Default port
- Fallback ports
- Health endpoint
- Startup timeout
- Watch mode support

## Troubleshooting

### Port Already in Use
```bash
# Use force mode to kill existing process
npm run smart:start:force

# Or manually kill the process
lsof -ti:3001 | xargs kill -9
```

### Server Won't Start
1. Check logs: `logs/kv-database.log`
2. Verify port availability: `lsof -i :3001`
3. Check environment variables
4. Run cleanup: `npm run smart:cleanup`

### Process Management Issues
```bash
# List all processes using ports
lsof -i :3001 -i :3002 -i :3003

# Kill all servers
npm run smart:cleanup

# Check server status
npm run smart:list
```

## Development Workflow

### Starting Development
```bash
# Start main server with watch mode
npm run smart:start:watch

# Start multiple servers
npm run smart:start:kv
npm run smart:start:graph
```

### Stopping Development
```bash
# Stop specific server
npm run smart:stop:kv

# Stop all servers
npm run smart:cleanup
```

### Monitoring
```bash
# Check server status
npm run smart:list

# View server logs
tail -f logs/kv-database.log
```

## Advanced Usage

### Custom Port
```bash
# Start on specific port
PORT=3005 npm run smart:start:kv
```

### Multiple Instances
```bash
# Start multiple instances on different ports
PORT=3001 npm run smart:start:kv
PORT=3002 npm run smart:start:kv
```

### Integration with CI/CD
```bash
# Clean start for CI
npm run smart:cleanup
npm run smart:start:kv
```

## File Structure

```
scripts/
├── smart-start.sh          # Main shell script
├── port-manager.ts         # TypeScript port manager
└── README.md              # This file

logs/                      # Server logs
├── kv-database.log
├── graph-rag.log
└── rag-editor.log

.server.pid                # Process tracking file
```

## Comparison with Kokoro Project

This implementation takes inspiration from the kokoro project's port management:

- **Similar Features**: Dynamic port detection, process cleanup, health checking
- **Enhanced**: Better process tracking, multiple server support, TypeScript interface
- **Simplified**: Easier to use with npm scripts, better error handling

## Contributing

When adding new servers:
1. Add server config to `SERVERS` array in both scripts
2. Update package.json scripts
3. Test with `npm run smart:list`
4. Update this README

## License

MIT - Same as main project
