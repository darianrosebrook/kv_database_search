# Port Management System

This project includes a dynamic port selection system to handle conflicts when multiple local projects are running simultaneously.

## How It Works

### Automatic Port Selection
- **Default Behavior**: The server automatically finds an available port starting from the default port (3001)
- **Port Range**: Tries ports from 3001 to 3010 (configurable via `MAX_PORT_ATTEMPTS`)
- **Fallback**: If no ports are available in the range, the server will fail with a clear error message

### Manual Port Selection
You can force the server to use a specific port using environment variables:

```bash
# Force specific ports
npm run server:3001   # Use port 3001
npm run server:3002   # Use port 3002
npm run server:3003   # Use port 3003

# Or set environment variable directly
PORT=3004 npm run server
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run server` | Auto-find available port (recommended) |
| `npm run dev` | Development mode with auto-reload and dynamic ports |
| `npm run server:3001` | Force port 3001 |
| `npm run server:3002` | Force port 3002 |
| `npm run server:3003` | Force port 3003 |

## Configuration

### Environment Variables
- `PORT`: Set default starting port (default: 3001)
- `MAX_PORT_ATTEMPTS`: Number of ports to try (default: 10)

### Code Configuration
The dynamic port system is implemented in `src/server.ts`:

```typescript
const DEFAULT_PORT = parseInt(process.env.PORT || "3001");
const MAX_PORT_ATTEMPTS = 10;

async function findAvailablePort(startPort: number): Promise<number> {
  // Implementation that checks ports sequentially
}
```

## Benefits

### ✅ No More Port Conflicts
- Automatically finds available ports
- Clear error messages when no ports are available
- Multiple instances can run simultaneously

### ✅ Developer Friendly
- Simple to use with npm scripts
- Clear logging of which port is being used
- Environment variable support for different configurations

### ✅ Production Ready
- Graceful fallback when ports are unavailable
- Configurable port ranges
- Consistent behavior across environments

## Troubleshooting

### "No available ports found" Error
This occurs when all ports in the range are in use. Solutions:
1. **Stop other processes**: Free up some ports
2. **Increase port range**: Modify `MAX_PORT_ATTEMPTS` in the code
3. **Use specific port**: Force a specific port that's known to be available

### Port Already in Use
The system will automatically try the next available port and log the change:
```
⚠️  Port 3001 is in use, trying 3002...
✅ Port 3002 is available
📡 Starting on port: 3002
```

### Check Current Port Usage
```bash
# See what's using a specific port
lsof -i :3001
lsof -i :3002

# List all processes using common development ports
lsof -i :3000-3010
```

## Example Usage

### Multiple Projects Running
```bash
# Terminal 1: Start first project
cd project1 && npm run server
# Output: 📡 Starting on port: 3001

# Terminal 2: Start second project
cd project2 && npm run server
# Output: ⚠️  Port 3001 is in use, trying 3002...
#         ✅ Port 3002 is available
#         📡 Starting on port: 3002

# Terminal 3: Start third project
cd project3 && npm run server
# Output: ⚠️  Port 3001 is in use, trying 3002...
#         ⚠️  Port 3002 is in use, trying 3003...
#         ✅ Port 3003 is available
#         📡 Starting on port: 3003
```

This system makes it easy to run multiple local projects without worrying about port conflicts!
