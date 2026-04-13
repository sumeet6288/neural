'use client';

import { useState } from 'react';
import { 
  TrendingUp,
  Wallet, 
  Coins, 
  DollarSign, 
  Users, 
  Award,
  Copy,
  Clock,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import toast from 'react-hot-toast';
import CountdownTimer from '@/components/CountdownTimer';

// Stats Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
}) {
  return (
    <div className="glass-aip p-6 rounded-xl border border-white/10 hover:border-aip-green/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center group-hover:bg-aip-green/20 transition-colors">
          <Icon className="w-6 h-6 text-aip-green" />
        </div>
      </div>
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && <p className="text-aip-green text-sm mt-1">{subValue}</p>}
    </div>
  );
}

// Staking Option Card
function StakingCard({ 
  type, 
  period, 
  bonus, 
  onStake 
}: { 
  type: 'Flexible' | 'Fixed'; 
  period: string; 
  bonus: string;
  onStake: () => void;
}) {
  return (
    <div className="glass-aip p-5 rounded-xl border border-white/10 hover:border-aip-green/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-aip-green/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-aip-green" />
          </div>
          <div>
            <p className="text-white font-semibold">{type} Stake</p>
            <p className="text-white/40 text-sm">NEURON</p>
          </div>
        </div>
        <button 
          onClick={onStake}
          className="btn-aip-primary py-2 px-4 text-sm"
        >
          Stake
        </button>
      </div>
      
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          <Clock className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-sm">{period}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">{bonus}</span>
        </div>
      </div>
    </div>
  );
}

// Referral Stats Card
function ReferralStatCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="glass-aip p-4 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-aip-green/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-aip-green" />
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase">{label}</p>
          <p className="text-white font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Progress Bar
function ProgressBar({ 
  label, 
  current, 
  target, 
  percentage 
}: { 
  label: string; 
  current: string; 
  target: string;
  percentage: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/60 text-sm">{label}</span>
        <span className="text-white/40 text-xs">{percentage}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full bg-gradient-to-r from-aip-green to-aip-green-light rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-aip-green">{current}</span>
        <span className="text-white/40">{target}</span>
      </div>
    </div>
  );
}

// Staking Modal
function StakingModal({ 
  isOpen, 
  onClose, 
  type,
  period,
  bonus 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  type: string;
  period: string;
  bonus: string;
}) {
  const [amount, setAmount] = useState('');
  const { isConnected } = usePolygonData();
  // DISABLED: Real staking - contracts not deployed
  // const { neuronBalance, stake, isLoading } = useStaking();
  
  const neuronBalance = "0.000";
  const isLoading = false;
  const stake = async () => { return false; };

  if (!isOpen) return null;

  const balance = parseFloat(neuronBalance || '0');

  const handleMax = () => {
    setAmount(balance.toString());
  };

  const handlePercentage = (pct: string) => {
    const percentage = parseInt(pct);
    const calculatedAmount = (balance * percentage / 100).toFixed(2);
    setAmount(calculatedAmount);
  };

  const handleConfirmStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    // DISABLED: Real staking not available yet
    toast.success(`Demo Mode: Would stake ${amount} NEURON for ${period}`);
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-aip w-full max-w-md rounded-2xl border border-white/10 p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
        >
          ✕
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-aip-green/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-aip-green" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{type} Stake {period}</h3>
            <span className="text-amber-400 text-sm">{bonus}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-aip p-4 rounded-lg">
            <p className="text-white/40 text-sm mb-1">Available Balance</p>
            <p className="text-white font-semibold">{balance.toFixed(3)} NEURON</p>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Amount to Stake</label>
            <div className="relative">
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-aip w-full pr-20"
              />
              <button 
                onClick={handleMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-aip-green text-sm font-medium hover:text-aip-green-light"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {['25%', '50%', '75%', '100%'].map((pct) => (
              <button 
                key={pct}
                onClick={() => handlePercentage(pct)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors"
              >
                {pct}
              </button>
            ))}
          </div>

          {!isConnected ? (
            <p className="text-red-400 text-sm text-center">First connect your wallet</p>
          ) : null}

          <button 
            onClick={handleConfirmStake}
            disabled={!isConnected || !amount || isLoading}
            className="btn-aip-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Staking...' : 'Confirm Stake'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { address, isConnected, connect, isConnecting } = usePolygonData();
  
  // Static demo data
  const loading = false;
  const protocolMetrics = {
    marketCap: "$17,316,457.99",
    tvl: "3,711,771.81",
    totalSupply: "7,986,831.94",
    tokenPrice: "$2.17",
    totalStaked: "5,234,567.89",
    stakingRatio: "65.54%"
  };
  
  const userMetrics = {
    neuronBalance: "0.000",
    totalStaked: "0.000",
    pendingRewards: "0.000",
    referralCount: 0,
    rank: "N/A"
  };
  const neuronBalance = "0.000";
  const refresh = () => {};
  
  const [activeTab, setActiveTab] = useState('stake');
  const [stakingModal, setStakingModal] = useState<{isOpen: boolean; type: string; period: string; bonus: string}>({
    isOpen: false,
    type: '',
    period: '',
    bonus: ''
  });

  const openStakingModal = (type: string, period: string, bonus: string) => {
    setStakingModal({ isOpen: true, type, period, bonus });
  };

  return (
    <div className="min-h-screen bg-[#010101] pt-20 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/50">NeuraFinance Statistics</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => {
              if (!isConnected) {
                toast.error('Please connect your wallet first');
                return;
              }
              toast.success('NEURON token added to wallet');
            }}
            className="btn-aip py-2 px-4 text-sm flex items-center gap-2 hover:bg-aip-green/20 transition-colors"
          >
            <span>Add NEURON</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              if (!isConnected) {
                toast.error('Please connect your wallet first');
                return;
              }
              toast.success('gNEURON token added to wallet');
            }}
            className="btn-aip py-2 px-4 text-sm flex items-center gap-2 hover:bg-aip-green/20 transition-colors"
          >
            <span>Add gNEURON</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Referral Link */}
        <div className="glass-aip p-4 rounded-xl border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-white/60 text-sm whitespace-nowrap">Referral Link:</span>
            <div className="flex-1 relative">
              <input 
                type="text"
                value={isConnected ? `https://dao.neurafinance.io/?ref=${address}` : 'Connect wallet to see referral link'}
                readOnly
                className="input-aip w-full pr-12 text-sm"
              />
              <button 
                onClick={() => {
                  if (!isConnected) {
                    toast.error('Please connect your wallet first');
                    return;
                  }
                  const link = `https://dao.neurafinance.io/?ref=${address}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Referral link copied to clipboard!');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-aip-green transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-aip py-2 px-4 text-sm flex items-center gap-2 hover:bg-aip-green/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <StatCard 
            icon={DollarSign}
            label="Market Cap"
            value={protocolMetrics.marketCap}
          />
          <StatCard 
            icon={Wallet}
            label="Treasury Balance"
            value={protocolMetrics.tvl}
            subValue="USD"
          />
          <StatCard 
            icon={Coins}
            label="Total Supply"
            value={protocolMetrics.totalSupply}
            subValue="NEURON"
          />
          <StatCard 
            icon={TrendingUp}
            label="Current Token Price"
            value={protocolMetrics.tokenPrice}
          />
          <StatCard 
            icon={Wallet}
            label="Wallet NEURON Balance"
            value={isConnected ? userMetrics.neuronBalance : "Connect Wallet"}
          />
          <StatCard 
            icon={TrendingUp}
            label="Total Staked"
            value={protocolMetrics.totalStaked}
            subValue={`(${protocolMetrics.stakingRatio} of supply)`}
          />
        </div>

        {/* Staking Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Staking</h2>
              <p className="text-white/50 text-sm">Earn rewards when you stake your NEURON</p>
            </div>
            <CountdownTimer />
          </div>

          {/* Staking Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button 
              onClick={() => setActiveTab('stake')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'stake' ? 'text-aip-green' : 'text-white/50 hover:text-white'
              }`}
            >
              Stake List
              {activeTab === 'stake' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('my')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'my' ? 'text-aip-green' : 'text-white/50 hover:text-white'
              }`}
            >
              My Staking
              {activeTab === 'my' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />
              )}
            </button>
          </div>

          {/* Staking Content */}
          {activeTab === 'stake' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StakingCard 
                type="Flexible"
                period="24 Hours"
                bonus="0.6% Bonus"
                onStake={() => openStakingModal('Flexible', '24h', '0.6% Bonus')}
              />
              <StakingCard 
                type="Fixed"
                period="45 Days"
                bonus="0.7% Bonus"
                onStake={() => openStakingModal('Fixed', '45 Days', '0.7% Bonus')}
              />
              <StakingCard 
                type="Fixed"
                period="90 Days"
                bonus="0.8% Bonus"
                onStake={() => openStakingModal('Fixed', '90 Days', '0.8% Bonus')}
              />
              <StakingCard 
                type="Fixed"
                period="180 Days"
                bonus="0.9% Bonus"
                onStake={() => openStakingModal('Fixed', '180 Days', '0.9% Bonus')}
              />
              <StakingCard 
                type="Fixed"
                period="360 Days"
                bonus="1.0% Bonus"
                onStake={() => openStakingModal('Fixed', '360 Days', '1.0% Bonus')}
              />
            </div>
          ) : (
            <div className="glass-aip p-8 rounded-xl border border-white/10 text-center">
              <p className="text-white/50 mb-2">No active staking positions</p>
              <p className="text-white/30 text-sm mb-4">Start staking to earn rewards</p>
              <button 
                onClick={() => setActiveTab('stake')}
                className="btn-aip-primary py-2 px-4 text-sm"
              >
                Start Staking
              </button>
            </div>
          )}
        </div>

        {/* Alliance/Rewards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Rewards */}
          <div className="glass-aip p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Guild Rewards</h3>
            <div className="grid grid-cols-2 gap-4">
              <ReferralStatCard 
                icon={Award}
                label="My Rank"
                value={loading ? "..." : (isConnected ? userMetrics?.rank || "N/A" : "Connect")}
              />
              <ReferralStatCard 
                icon={Coins}
                label="My Staking"
                value={loading ? "..." : (isConnected ? `${userMetrics?.totalStaked || "0.000"} NEURON` : "Connect")}
              />
              <ReferralStatCard 
                icon={TrendingUp}
                label="Pending Rewards"
                value={loading ? "..." : (isConnected ? `${userMetrics?.pendingRewards || "0.000"} NEURON` : "Connect")}
              />
              <ReferralStatCard 
                icon={Users}
                label="Referrals"
                value={loading ? "..." : (isConnected ? userMetrics?.referralCount?.toString() || "0" : "Connect")}
              />
            </div>
          </div>

          {/* Rank Progress */}
          <div className="glass-aip p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Next Rank Progress</h3>
            <p className="text-aip-green text-sm mb-6">Next Rank: Nova</p>
            
            <ProgressBar 
              label="My Stake Progress"
              current="0.000 USD"
              target="1,000 USD"
              percentage={0}
            />
            <ProgressBar 
              label="Team Business Progress"
              current="0.000 USD"
              target="10,000 USD"
              percentage={0}
            />
            <ProgressBar 
              label="Direct Active Referral"
              current="0"
              target="5 Active"
              percentage={0}
            />
          </div>
        </div>

        {/* Team Stats */}
        <div className="glass-aip p-6 rounded-xl border border-white/10 mb-12">
          <h3 className="text-xl font-bold text-white mb-6">Team Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <p className="text-white/40 text-sm mb-1">Team Members</p>
              <p className="text-3xl font-bold text-white">0</p>
            </div>
            <div className="text-center p-4">
              <p className="text-white/40 text-sm mb-1">Active Members</p>
              <p className="text-3xl font-bold text-aip-green">0</p>
            </div>
            <div className="text-center p-4">
              <p className="text-white/40 text-sm mb-1">Team Business</p>
              <p className="text-3xl font-bold text-white">0.000</p>
              <p className="text-white/40 text-sm">NEURON</p>
            </div>
          </div>
        </div>
      </main>

      {/* Staking Modal */}
      <StakingModal 
        isOpen={stakingModal.isOpen}
        onClose={() => setStakingModal({ ...stakingModal, isOpen: false })}
        type={stakingModal.type}
        period={stakingModal.period}
        bonus={stakingModal.bonus}
      />
    </div>
  );
}
