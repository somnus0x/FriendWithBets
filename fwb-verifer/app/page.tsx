'use client';

import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [fid, setFid] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!username.trim() && !fid.trim()) {
      setError('Please enter either a Farcaster username or FID');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/prove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          fid: fid.trim() || undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult({ type: 'verify', data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify Farcaster user');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4">Farcaster Verifier</h1>
          <p className="text-gray-400 text-lg">Verify Farcaster user profiles using Neynar API</p>
        </div>

        <div className="space-y-8">
          {/* Username Input */}
          <div className="space-y-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Farcaster Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dwr"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7235e5] focus:border-transparent text-white placeholder-gray-500"
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500">
              Enter a Farcaster username (e.g., dwr, v)
            </p>
          </div>

          {/* FID Input */}
          <div className="space-y-4">
            <label htmlFor="fid" className="block text-sm font-medium text-gray-300">
              Or Farcaster ID (FID)
            </label>
            <input
              id="fid"
              type="number"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7235e5] focus:border-transparent text-white placeholder-gray-500"
              disabled={isVerifying}
            />
            <p className="text-xs text-gray-500">
              Enter a Farcaster ID (FID) number
            </p>
          </div>

          {/* Action Button */}
          <div className="flex gap-4">
            <button
              onClick={handleVerify}
              disabled={(!username.trim() && !fid.trim()) || isVerifying}
              className="flex-1 px-6 py-3 bg-[#7235e5] hover:bg-[#5d2bc7] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify User'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && result.data?.user && (
            <div className="space-y-4">
              {/* Detailed verification modal with profile picture */}
              <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300 mb-4">✅ Verification Successful</h3>
                <div className="flex items-center space-x-4 mb-4">
                  {result.data.user.pfpUrl && (
                    <img 
                      src={result.data.user.pfpUrl} 
                      alt={result.data.user.username || result.data.user.displayName}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium text-lg">
                      {result.data.user.displayName || result.data.user.username}
                    </p>
                    <p className="text-gray-400 text-sm">@{result.data.user.username}</p>
                    <p className="text-gray-500 text-xs">FID: {result.data.user.fid}</p>
                  </div>
                </div>
                
                {result.data.user.bio && (
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm">{result.data.user.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#7235e5]/10 border border-[#7235e5]/20 rounded-lg p-4">
                    <p className="text-[#7235e5] font-semibold text-xl">
                      {result.data.user.followerCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Followers</p>
                  </div>
                  <div className="bg-[#7235e5]/10 border border-[#7235e5]/20 rounded-lg p-4">
                    <p className="text-[#7235e5] font-semibold text-xl">
                      {result.data.user.followingCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Following</p>
                  </div>
                </div>

                {result.data.user.verifiedAddresses && result.data.user.verifiedAddresses.length > 0 && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm font-medium mb-2">Verified Addresses</p>
                    <div className="space-y-1">
                      {result.data.user.verifiedAddresses.map((addr: any, idx: number) => (
                        <p key={idx} className="text-gray-400 text-xs font-mono">
                          {addr.address?.address || addr}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Full verification response */}
              <details className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <summary className="text-sm font-medium text-gray-300 cursor-pointer">
                  Full Verification Response
                </summary>
                <pre className="text-xs text-gray-400 overflow-x-auto mt-2">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
        
        {/* Powered by Neynar Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex justify-center items-center space-x-2 text-gray-500">
            <span className="text-sm">Powered by</span>
            <a 
              href="https://neynar.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#7235e5] hover:underline font-medium"
            >
              Neynar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
