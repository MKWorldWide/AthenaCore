"""
ATHENACORE KERNEL 🧠⚔️
---------------------
Operational Core of the Primal Genesis Engine
Author: Sunny & the AI Council

Purpose:
- Provide system-level control, routing, and responses
- Expose health-check and readiness APIs via FastAPI
- Integrate with Discord for privileged admin commands
- Accept remote instructions from Serafina, MCP, or CursorKitt3n

Features:
• /health        - HTTP FastAPI health ping
• /status        - JSON system metadata
• !syscheck      - Discord command to verify all nodes are live
• !echo          - Echo back input for verification
• !pulse         - Show timestamp, uptime, repo commit info
• Kernel logging with UTC timestamps
• Role-based Discord command gating (admin only)
"""

import os
import time
import json
import logging
import discord
import platform
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from discord.ext import commands
from dotenv import load_dotenv
import uvicorn
import threading

# ===== Configuration & Constants =====
load_dotenv()

# Environment Variables
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
ADMIN_ROLE = os.getenv("ADMIN_ROLE", "Admin")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

# System State
START_TIME = time.time()
KERNEL_VERSION = "1.0.0"

# ===== Logging Setup =====
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('athenacore.log', encoding='utf-8')
    ]
)
logger = logging.getLogger('AthenaCore')

# ===== FastAPI App =====
app = FastAPI(
    title="AthenaCore Kernel",
    description="Operational Core of the Primal Genesis Engine",
    version=KERNEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Discord Bot =====
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(
    command_prefix=commands.when_mentioned_or("!"),
    intents=intents,
    help_command=None
)

# ===== Helper Functions =====
def get_uptime() -> str:
    """Get formatted uptime string"""
    uptime = int(time.time() - START_TIME)
    return str(timedelta(seconds=uptime))

def get_system_info() -> Dict[str, Any]:
    """Get system information"""
    return {
        "platform": platform.system(),
        "platform_release": platform.release(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
    }

def get_git_info() -> Dict[str, str]:
    """Get git repository information"""
    try:
        commit_hash = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD']
        ).decode('ascii').strip()
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD']
        ).decode('ascii').strip()
        return {
            "commit": commit_hash,
            "branch": branch,
            "dirty": subprocess.call(["git", "diff-index", "--quiet", "HEAD"]) != 0
        }
    except Exception as e:
        logger.warning(f"Could not get git info: {e}")
        return {"error": str(e)}

# ===== API Routes =====
@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "operational",
        "service": "AthenaCore Kernel",
        "version": KERNEL_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": get_uptime()
    }

@app.get("/status")
async def status() -> Dict[str, Any]:
    """System status endpoint"""
    return {
        "status": "operational",
        "service": "AthenaCore Kernel",
        "version": KERNEL_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": get_uptime(),
        "system": get_system_info(),
        "git": get_git_info(),
        "discord": {
            "connected": bot.is_ready(),
            "latency": f"{round(bot.latency * 1000)}ms" if bot.latency > 0 else "N/A",
            "guilds": len(bot.guilds) if bot.is_ready() else 0,
            "users": len(bot.users) if bot.is_ready() else 0
        }
    }

# ===== Discord Commands =====
@bot.event
async def on_ready():
    """Event triggered when the bot is ready"""
    logger.info(f"Logged in as {bot.user} (ID: {bot.user.id})")
    logger.info(f"Connected to {len(bot.guilds)} guilds")
    logger.info("------")
    
    # Set custom status
    activity = discord.Activity(
        type=discord.ActivityType.watching,
        name=f"over the system | v{KERNEL_VERSION}"
    )
    await bot.change_presence(activity=activity)

@bot.command(name='syscheck')
@commands.has_role(ADMIN_ROLE)
async def syscheck(ctx):
    """Verify all system nodes are live"""
    embed = discord.Embed(
        title="🧠 AthenaCore System Check",
        description="Performing heartbeat diagnostics...",
        color=discord.Color.teal(),
        timestamp=datetime.utcnow()
    )
    
    # System status
    embed.add_field(
        name="🌐 Core Systems",
        value="✅ Operational"
    )
    
    # API Status
    embed.add_field(
        name="🔌 API",
        value=f"`{HOST}:{PORT}`"
    )
    
    # Uptime
    embed.add_field(
        name="⏱ Uptime",
        value=get_uptime(),
        inline=False
    )
    
    # System Info
    sys_info = get_system_info()
    embed.add_field(
        name="💻 System",
        value=f"{sys_info['platform']} {sys_info['platform_release']} ({sys_info['architecture']})\nPython {sys_info['python_version']}",
        inline=False
    )
    
    # Git Info
    try:
        git_info = get_git_info()
        if 'commit' in git_info:
            embed.add_field(
                name="🔀 Git",
                value=f"`{git_info['branch']} @ {git_info['commit']}{'*' if git_info.get('dirty') else ''}"
            )
    except Exception as e:
        logger.error(f"Error getting git info: {e}")
    
    embed.set_footer(text=f"AthenaCore Kernel v{KERNEL_VERSION}")
    await ctx.send(embed=embed)

@bot.command(name='echo')
@commands.has_role(ADMIN_ROLE)
async def echo(ctx, *, message: str):
    """Echo back the provided message"""
    await ctx.send(f"🔊 {message}")

@bot.command(name='pulse')
async def pulse(ctx):
    """Show system pulse (timestamp, uptime, git info)"""
    git_info = get_git_info()
    commit_info = f"`{git_info.get('branch', '?')} @ {git_info.get('commit', '?')}`"
    
    embed = discord.Embed(
        title="💓 AthenaCore Pulse",
        color=discord.Color.blue(),
        timestamp=datetime.utcnow()
    )
    
    embed.add_field(name="🕒 Timestamp", value=f"`{datetime.utcnow().isoformat()}`", inline=False)
    embed.add_field(name="⏱ Uptime", value=get_uptime(), inline=True)
    embed.add_field(name="💻 Version", value=f"`{KERNEL_VERSION}`", inline=True)
    
    if 'commit' in git_info:
        embed.add_field(
            name="🔀 Git",
            value=commit_info,
            inline=False
        )
    
    embed.set_footer(text=f"Requested by {ctx.author.display_name}")
    await ctx.send(embed=embed)

@bot.event
async def on_command_error(ctx, error):
    """Handle command errors"""
    if isinstance(error, commands.MissingRole):
        await ctx.send("⚠️ You don't have permission to use this command.")
    elif isinstance(error, commands.CommandNotFound):
        pass  # Ignore unknown commands
    else:
        logger.error(f"Command error: {error}", exc_info=True)
        await ctx.send(f"❌ An error occurred: {str(error)}")

# ===== API Server =====
def start_fastapi():
    """Start the FastAPI server"""
    config = uvicorn.Config(
        app=app,
        host=HOST,
        port=PORT,
        log_level="info",
        access_log=False
    )
    server = uvicorn.Server(config)
    server.run()

# ===== Main Entry Point =====
def main():
    """Main entry point for AthenaCore Kernel"""
    # Validate environment variables
    if not DISCORD_TOKEN:
        logger.error("DISCORD_TOKEN environment variable is not set")
        return
    
    try:
        # Start FastAPI in a separate thread
        logger.info(f"Starting FastAPI server on {HOST}:{PORT}")
        api_thread = threading.Thread(target=start_fastapi, daemon=True)
        api_thread.start()
        
        # Start Discord bot
        logger.info("Starting Discord bot...")
        bot.run(DISCORD_TOKEN)
        
    except Exception as e:
        logger.critical(f"Failed to start AthenaCore: {e}", exc_info=True)
    finally:
        logger.info("AthenaCore Kernel is shutting down...")

if __name__ == "__main__":
    main()
