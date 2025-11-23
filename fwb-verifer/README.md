# Farcaster Verifier

A Next.js application that verifies Farcaster user profiles using Neynar API.

## Overview

This tool allows you to verify Farcaster user profiles by looking up users by their username or FID (Farcaster ID). It uses Neynar's API to fetch and display verified Farcaster user information including profile data, follower counts, and verified addresses.

## Prerequisites

- Node.js 20+
- npm or pnpm
- Neynar API key

## Installation

```bash
npm install
```

## Configuration

Create a `.env.local` file with your Neynar API key:

```
NEYNAR_API_KEY=your_neynar_api_key
```

### Getting a Neynar API Key

1. Visit [Neynar](https://neynar.com) and create an account
2. Navigate to your dashboard and generate an API key
3. Copy the API key and add it to your `.env.local` file

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Enter either:
   - A Farcaster username (e.g., `dwr`, `v`)
   - Or a Farcaster ID (FID) number (e.g., `1`, `2`)

4. Click "Verify User" to fetch and display the user's profile information

## API Endpoints

- `POST /api/prove` - Verify a Farcaster user by username or FID
  - Request body: `{ username?: string, fid?: string }`
  - Returns: User profile data including FID, username, display name, bio, profile picture, follower/following counts, and verified addresses

- `POST /api/verify` - Verify a Farcaster user by FID or Ethereum address
  - Request body: `{ fid?: string, address?: string }`
  - Returns: Verified user profile data

## Features

- Lookup Farcaster users by username or FID
- Display user profile information including:
  - Profile picture
  - Display name and username
  - Bio
  - Follower and following counts
  - Verified Ethereum addresses
- Clean, modern UI with error handling

## Documentation

For more information about Neynar API, visit the official documentation:

- [Neynar Documentation](https://docs.neynar.com/)
- [Getting Started with Neynar](https://docs.neynar.com/docs/getting-started-with-neynar)
- [Neynar API Reference](https://docs.neynar.com/reference)
