"""
AthenaCore Kernel - The Operational Core of the Primal Genesis Engine

This module implements the core functionality of AthenaCore, including:
- FastAPI web server with health checks and status endpoints
- Discord bot with role-based command system
- System monitoring and diagnostics
- Integration points for Serafina and other services
"""

import asyncio
import logging
import os
import platform
import socket
import time
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import discord
import psutil
import uvicorn
from discord.ext import commands
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from git import Repo
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S%z",
)
logger = logging.getLogger("athenacore")

# Constants
VERSION = "0.1.0"
START_TIME = time.time()

# Pydantic models for API responses
class HealthCheckResponse(BaseModel):
    status: str = "ok"
    version: str = VERSION
    uptime: float = Field(..., description="Uptime in seconds")
    timestamp: str = Field(..., description="ISO 8601 timestamp")

class SystemStatusResponse(BaseModel):
    status: str = "operational"
    version: str = VERSION
    system: Dict[str, str] = Field(..., description="System information")
    resources: Dict[str, float] = Field(..., description="System resource usage")
    services: Dict[str, str] = Field(..., description="Service statuses")
    timestamp: str = Field(..., description="ISO 8601 timestamp")

class CommandResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None

# Initialize FastAPI app
app = FastAPI(
    title="AthenaCore API",
    description="Operational Core of the Primal Genesis Engine",
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Discord bot
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(
    command_prefix=commands.when_mentioned_or("!"),
    intents=intents,
    help_command=None,
)

# Global state
class KernelState:
    def __init__(self):
        self.start_time = time.time()
        self.command_count = 0
        self.last_error = None
        self.git_info = self._get_git_info()

    @staticmethod
    def _get_git_info() -> Dict[str, str]:
        """Get git repository information if available."""
        try:
            repo = Repo(search_parent_directories=True)
            branch = repo.active_branch
            return {
                "branch": str(branch),
                "commit": str(repo.head.commit.hexsha),
                "dirty": repo.is_dirty(),
            }
        except Exception as e:
            logger.warning(f"Could not get git info: {e}")
            return {"branch": "unknown", "commit": "unknown", "dirty": False}

state = KernelState()

# Utility functions
def get_system_info() -> Dict[str, str]:
    """Get system information."""
    return {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "hostname": socket.gethostname(),
        "cpu_count": str(psutil.cpu_count()),
        "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
    }

def get_resource_usage() -> Dict[str, float]:
    """Get system resource usage."""
    process = psutil.Process()
    memory = process.memory_info()
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_rss_mb": memory.rss / (1024 * 1024),  # Convert to MB
        "memory_percent": process.memory_percent(),
        "disk_usage_percent": psutil.disk_usage("/").percent,
    }

# API Endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": VERSION,
        "uptime": time.time() - state.start_time,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/status", response_model=SystemStatusResponse)
async def system_status():
    """Get detailed system status."""
    return {
        "status": "operational",
        "version": VERSION,
        "system": get_system_info(),
        "resources": get_resource_usage(),
        "services": {
            "discord_bot": "online" if bot.is_ready() else "offline",
            "api_server": "online",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error"},
    )

# Discord Commands
@bot.event
async def on_ready():
    """Event triggered when the Discord bot is ready."""
    logger.info(f"Logged in as {bot.user} (ID: {bot.user.id})")
    logger.info(f"Connected to {len(bot.guilds)} guilds")
    
    # Set custom status
    activity = discord.Activity(
        type=discord.ActivityType.watching,
        name=f"over the system | v{VERSION}",
    )
    await bot.change_presence(activity=activity)

@bot.command(name="syscheck")
@commands.has_role(os.getenv("ADMIN_ROLE", "Admin"))
async def syscheck(ctx):
    """Run system diagnostics (Admin only)."""
    try:
        # Get system info
        system_info = get_system_info()
        resources = get_resource_usage()
        
        # Format response
        response = [
            "**System Diagnostics**",
            f"• **Version**: {VERSION}",
            f"• **Uptime**: {int(time.time() - state.start_time)}s",
            f"• **Platform**: {system_info['platform']}",
            f"• **Python**: {system_info['python_version']}",
            f"• **Host**: {system_info['hostname']}",
            "\n**Resource Usage**",
            f"• **CPU**: {resources['cpu_percent']:.1f}%",
            f"• **Memory**: {resources['memory_rss_mb']:.1f}MB ({resources['memory_percent']:.1f}%)",
            f"• **Disk**: {resources['disk_usage_percent']}% used",
        ]
        
        if state.git_info:
            response.extend([
                "\n**Git Info**",
                f"• **Branch**: {state.git_info.get('branch', 'unknown')}",
                f"• **Commit**: {state.git_info.get('commit', 'unknown')[:8]}",
                f"• **Dirty**: {'⚠️' if state.git_info.get('dirty') else '✅'}",
            ])
        
        await ctx.send("\n".join(response))
        
    except Exception as e:
        logger.error(f"Error in syscheck: {e}", exc_info=True)
        await ctx.send(f"❌ Error: {str(e)}")

@bot.command(name="pulse")
async def pulse(ctx):
    """Check if AthenaCore is alive and show version info."""
    try:
        uptime = int(time.time() - state.start_time)
        hours, remainder = divmod(uptime, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        response = [
            "**AthenaCore Pulse** ❤️",
            f"• **Version**: {VERSION}",
            f"• **Uptime**: {hours}h {minutes}m {seconds}s",
            f"• **Latency**: {round(bot.latency * 1000)}ms",
            "\n**Commands**: `!syscheck`, `!pulse`, `!echo`",
            "\n*Type `!help` for more info*",
        ]
        
        await ctx.send("\n".join(response))
        
    except Exception as e:
        logger.error(f"Error in pulse: {e}", exc_info=True)
        await ctx.send(f"❌ Error: {str(e)}")

@bot.command(name="echo")
@commands.has_role(os.getenv("ADMIN_ROLE", "Admin"))
async def echo(ctx, *, message: str):
    """Echo a message back (Admin only)."""
    try:
        await ctx.send(f"🔊 {message}")
    except Exception as e:
        logger.error(f"Error in echo: {e}", exc_info=True)
        await ctx.send(f"❌ Error: {str(e)}")

@bot.event
async def on_command_error(ctx, error):
    """Handle command errors."""
    if isinstance(error, commands.MissingRole):
        await ctx.send("⛔ You don't have permission to use this command.")
    elif isinstance(error, commands.CommandNotFound):
        await ctx.send("❓ Unknown command. Type `!help` for a list of commands.")
    else:
        logger.error(f"Command error: {error}", exc_info=True)
        await ctx.send(f"⚠️ An error occurred: {str(error)}")

# Startup and shutdown
def start_bot():
    """Start the Discord bot in the background."""
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        logger.warning("DISCORD_TOKEN not set. Discord bot will not start.")
        return
    
    async def start():
        try:
            await bot.start(token)
        except Exception as e:
            logger.critical(f"Failed to start Discord bot: {e}")
            # Exit the application if the bot can't start
            os._exit(1)
    
    # Run the bot in the background
    import threading
    thread = threading.Thread(target=lambda: asyncio.run(start()))
    thread.daemon = True
    thread.start()

def start_server():
    """Start the FastAPI server."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    
    logger.info(f"Starting AthenaCore v{VERSION}")
    logger.info(f"API server running on http://{host}:{port}")
    
    if os.getenv("DISCORD_TOKEN"):
        logger.info("Discord bot is connecting...")
        start_bot()
    else:
        logger.warning("DISCORD_TOKEN not set. Discord bot will not start.")
    
    # Start the FastAPI server
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        log_config=None,  # Use default uvicorn logging
    )

if __name__ == "__main__":
    start_server()
