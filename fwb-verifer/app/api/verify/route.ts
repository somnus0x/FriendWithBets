import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Configure max duration for Vercel
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, address } = body;
    
    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      );
    }

    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    
    let user;
    
    if (fid) {
      // Lookup user by FID
      try {
        const users = await client.fetchBulkUsers([parseInt(fid)]);
        user = users.users[0];
        if (!user) {
          return NextResponse.json(
            { error: `FID ${fid} not found on Farcaster` },
            { status: 404 }
          );
        }
      } catch (error: any) {
        const statusCode = error?.status || error?.statusCode || error?.response?.status;
        if (statusCode === 404 || error?.message?.includes('not found')) {
          return NextResponse.json(
            { error: `FID ${fid} not found on Farcaster` },
            { status: 404 }
          );
        }
        throw error;
      }
    } else if (address) {
      // Lookup user by Ethereum address
      try {
        const users = await client.fetchBulkUsersByEthOrSolAddress({ addresses: [address] });
        if (!users || users.length === 0) {
          return NextResponse.json(
            { error: `No Farcaster user found for address ${address}` },
            { status: 404 }
          );
        }
        user = users[0];
      } catch (error: any) {
        const statusCode = error?.status || error?.statusCode || error?.response?.status;
        if (statusCode === 404 || error?.message?.includes('not found')) {
          return NextResponse.json(
            { error: `No Farcaster user found for address ${address}` },
            { status: 404 }
          );
        }
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: 'Either fid or address must be provided' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      verified: true,
      user: {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        bio: user.profile.bio?.text,
        pfpUrl: user.pfp?.url,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        verifiedAddresses: user.verified_addresses,
        custodyAddress: user.custody_address,
        verifications: user.verifications,
      }
    });
  } catch (error) {
    console.error('Farcaster verification error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify Farcaster user' },
      { status: 500 }
    );
  }
}
