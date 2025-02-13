'use client';

import { useEffect, useState } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { getTokenHoldings } from './services/tokens';
import { getDelegations } from './services/delegations';
import { getDaoUpdates } from './services/updates';
import { UpdateCard } from './components/UpdateCard';
import type { DelegationResponse, DelegationsData, DaoUpdate } from './types/delegations';
import ImageSvg from './svg/Image';

export default function App() {
  const { address } = useAccount();
  const [delegationsData, setDelegationsData] = useState<DelegationsData | null>(null);
  const [updates, setUpdates] = useState<DaoUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!address) {
        setDelegationsData(null);
        setUpdates([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First get token holdings
        const holdings = await getTokenHoldings(address);
        console.log('Token holdings:', holdings);

        // Then fetch delegations with holdings data
        const data = await getDelegations(address, holdings);
        setDelegationsData(data);

        // Fetch updates for active and available DAOs
        const daoSlugs = [
          ...data.active_delegations.map(d => d.dao_slug),
          ...data.available_delegations.map(d => d.dao_slug)
        ];

        if (daoSlugs.length > 0) {
          const updatesData = await getDaoUpdates(daoSlugs, holdings);
          setUpdates(updatesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address]);

  const renderDaoCard = (delegation: DelegationResponse) => (
    <div className="p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--metallic-silver)] transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{delegation.dao_name}</h3>
      </div>
      <p className="text-sm text-gray-400">{delegation.token_amount}</p>
      {delegation.has_active_proposals && (
        <div className="mt-2 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 inline-block">
          Active Proposals
        </div>
      )}
      {delegation.proposals_count !== undefined && (
        <p className="text-sm text-gray-400 mt-2">
          {delegation.proposals_count} total proposals
        </p>
      )}
    </div>
  );

  // Group updates by priority
  const urgentUpdates = updates.filter(u => u.priority === 'urgent');
  const importantUpdates = updates.filter(u => u.priority === 'important');
  const fyiUpdates = updates.filter(u => u.priority === 'fyi');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10">
              <ImageSvg />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--metallic-silver)] to-white">
              Tabula
            </h1>
          </div>
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
                <EthBalance />
              </Identity>
              <WalletDropdownLink
                icon="wallet"
                href="https://keys.coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wallet
              </WalletDropdownLink>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {!address ? (
            <div className="glass-card rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Connect your wallet to view your DAO delegations and recommendations</p>
            </div>
          ) : loading ? (
            <div className="glass-card rounded-lg p-8 text-center">
              <p className="text-gray-400">Loading your DAO data...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
              {error}
            </div>
          ) : (
            <>
              {/* Updates Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DAO Updates */}
                <section className="glass-card rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">DAO Updates</h2>
                  <div className="h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                    {updates.length > 0 ? (
                      <>
                        {urgentUpdates.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-red-400 sticky top-0 bg-[var(--background)] py-2 z-10">Urgent Updates</h3>
                            {urgentUpdates.map(update => (
                              <UpdateCard key={update.id} update={update} />
                            ))}
                          </div>
                        )}
                        {importantUpdates.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-yellow-400 sticky top-0 bg-[var(--background)] py-2 z-10">Important Updates</h3>
                            {importantUpdates.map(update => (
                              <UpdateCard key={update.id} update={update} />
                            ))}
                          </div>
                        )}
                        {fyiUpdates.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-blue-400 sticky top-0 bg-[var(--background)] py-2 z-10">FYI</h3>
                            {fyiUpdates.map(update => (
                              <UpdateCard key={update.id} update={update} />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No updates available
                      </div>
                    )}
                  </div>
                </section>

                {/* Active Delegations Section */}
                <section className="glass-card rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Active Delegations</h2>
                  <div className="space-y-4">
                    {delegationsData?.active_delegations.length ? (
                      delegationsData.active_delegations.map((delegation, i) => (
                        <div key={`${delegation.dao_slug}-${i}`}>
                          {renderDaoCard(delegation)}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        You haven't delegated to any DAOs yet
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Available Delegations Section */}
              <section className="glass-card rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Available Delegations</h2>
                <p className="text-gray-400 mb-4">DAOs where you hold tokens and can delegate your voting power</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {delegationsData?.available_delegations?.length ? (
                    delegationsData.available_delegations.map((delegation, i) => (
                      <div key={`${delegation.dao_slug}-${i}`}>
                        {renderDaoCard(delegation)}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      No DAOs found where you can delegate
                    </div>
                  )}
                </div>
              </section>

              {/* Recommended DAOs Section */}
              <section className="glass-card rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Discover More DAOs</h2>
                <p className="text-gray-400 mb-4">Explore these DAOs based on governance activity and community engagement</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {delegationsData?.recommended_delegations?.length ? (
                    delegationsData.recommended_delegations.map((delegation, i) => (
                      <div key={`${delegation.dao_slug}-${i}`}>
                        {renderDaoCard(delegation)}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      No recommendations available
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}