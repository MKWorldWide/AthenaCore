# AthenaCore Kernel 🧠⚔️

> **Operational Core of the Primal Genesis Engine**

AthenaCore is the central nervous system of your AI infrastructure, providing system-level control, routing, and operational intelligence. It combines a FastAPI-based web service with a powerful Discord bot interface for privileged command execution.

## ✨ Features

- **🌐 Web Interface**
  - Health check endpoint (`/health`)
  - System status dashboard (`/status`)
  - RESTful API for integration
  - Swagger & ReDoc documentation

- **🤖 Discord Integration**
  - Role-based command access
  - System monitoring and diagnostics
  - Real-time alerts and notifications
  - Interactive help system

- **🔧 System Management**
  - Uptime tracking
  - Performance monitoring
  - Git integration for version tracking
  - Container-ready with Docker

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (optional)
- Discord Bot Token ([Create one here](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/athenacore.git
   cd athenacore/athenacore_py
   ```

2. **Set up environment**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Configure the application**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your Discord token and settings
   # nano .env  # or use your preferred editor
   ```

### Running with Python

```bash
# Start AthenaCore
python athenacore_bot.py
```

### Running with Docker

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## 📚 Documentation

### API Endpoints

- `GET /health` - Basic health check
- `GET /status` - Detailed system status
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

### Discord Commands

- `!syscheck` - Run system diagnostics (Admin only)
- `!pulse` - Show system pulse and version info
- `!echo <message>` - Echo a message (Admin only)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Discord bot token | *Required* |
| `ADMIN_ROLE` | Role for admin commands | `Admin` |
| `HOST` | API server host | `0.0.0.0` |
| `PORT` | API server port | `8001` |
| `LOG_LEVEL` | Logging level | `INFO` |

## 🛠 Development

### Project Structure

```
athenacore_py/
├── athenacore_bot.py    # Main application
├── requirements.txt     # Python dependencies
├── .env.example        # Example environment config
├── Dockerfile          # Container configuration
└── docker-compose.yml  # Multi-container setup
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgements

- Built with ❤️ by Sunny & the AI Council
- Inspired by the need for robust AI infrastructure
- Powered by FastAPI, discord.py, and Python 3.11
