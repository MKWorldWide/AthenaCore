# AthenaCore Deployment Guide

This guide explains how to deploy AthenaCore to Render.

## Prerequisites

- A [Render](https://render.com) account
- A Discord Bot Token
- Your Discord Application ID and Public Key

## Deployment Steps

### 1. Set up a new Web Service on Render

1. Go to your [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub/GitLab repository or use the Render CLI

### 2. Configure Environment Variables

Set the following environment variables in the Render dashboard:

- `DISCORD_TOKEN`: Your bot token (starts with `MTQwMzI0OTUy...`)
- `DISCORD_APPLICATION_ID`: `1403249521571532821`
- `DISCORD_PUBLIC_KEY`: Your application's public key
- `NODE_ENV`: `production`
- `PORT`: `3000`

### 3. Configure Build & Deploy

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free (or choose a plan based on your needs)
- **Region**: Choose a region closest to your users
- **Auto-Deploy**: Enable for automatic deployments

### 4. Deploy

Click "Create Web Service" to deploy your bot.

## Verifying Deployment

1. Check the logs in the Render dashboard for any errors
2. The bot should appear online in your Discord server
3. Use the `/` commands to test functionality

## Updating the Bot

- For automatic deployments, push changes to your main branch
- For manual deployments, trigger a new deploy from the Render dashboard

## Monitoring

Monitor your bot's performance and logs directly from the Render dashboard.

## Troubleshooting

- Check the logs in the Render dashboard for errors
- Ensure all environment variables are set correctly
- Verify the bot has the correct permissions in your Discord server
