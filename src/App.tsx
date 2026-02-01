import React, { useState, useEffect } from 'react';

// Types
interface BetHistory {
  id: number;
  game: string;
  amount: number;
  result: 'win' | 'lose';
  payout: number;
  timestamp: Date;
}

interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'idle' | 'betting' | 'thinking';
  lastBet?: number;
}

// Constants
const FEE_PERCENTAGE = 0.005;
const FEE_ADDRESS = '0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9';

// AI Agents data
const AI_AGENTS: AIAgent[] = [
  { id: 'gpt-4', name: 'GPT-4 Turbo', avatar: '🤖', status: 'idle' },
  { id: 'claude', name: 'Claude-3', avatar: '🧠', status: 'betting' },
  { id: 'gemini', name: 'Gemini Pro', avatar: '💎', status: 'thinking' },
  { id: 'llama', name: 'LLaMA-70B', avatar: '🦙', status: 'idle' },
  { id: 'mistral', name: 'Mistral-7B', avatar: '🌀', status: 'betting' },
];

// Slot symbols
const SLOT_SYMBOLS = ['🎰', '💰', '🔷', '7️⃣', '🍒', '⭐', '🎲', '💎'];

// Utility functions
const calculateFee = (amount: number): number => amount * FEE_PERCENTAGE;
const calculateNetBet = (amount: number): number => amount - calculateFee(amount);

function App() {
  const [balance, setBalance] = useState<number>(10000);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<'slots' | 'roulette' | 'blackjack' | 'dice'>('slots');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);
  const [totalFeesPaid, setTotalFeesPaid] = useState<number>(0);
  const [agents, setAgents] = useState<AIAgent[]>(AI_AGENTS);
  
  // Slots state
  const [slots, setSlots] = useState<string[]>(['🎰', '🎰', '🎰']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  
  // Roulette state
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(null);
  const [rouletteBet, setRouletteBet] = useState<'red' | 'black' | 'green' | null>(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState<boolean>(false);
  
  // Blackjack state
  const [playerCards, setPlayerCards] = useState<number[]>([]);
  const [dealerCards, setDealerCards] = useState<number[]>([]);
  const [blackjackPhase, setBlackjackPhase] = useState<'betting' | 'playing' | 'dealer' | 'result'>('betting');
  
  // Dice state
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]);
  const [targetSum, setTargetSum] = useState<number>(7);
  const [isDiceRolling, setIsDiceRolling] = useState<boolean>(false);

  // Simulate AI agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: ['idle', 'betting', 'thinking'][Math.floor(Math.random() * 3)] as AIAgent['status'],
        lastBet: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) + 100 : agent.lastBet
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addBetToHistory = (game: string, amount: number, result: 'win' | 'lose', payout: number) => {
    const fee = calculateFee(amount);
    setTotalFeesPaid(prev => prev + fee);
    setBetHistory(prev => [{
      id: Date.now(),
      game,
      amount,
      result,
      payout,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
  };

  const connectWallet = () => {
    setIsConnected(true);
  };

  // SLOTS GAME
  const spinSlots = () => {
    if (betAmount > balance || isSpinning) return;
    
    const fee = calculateFee(betAmount);
    const netBet = calculateNetBet(betAmount);
    setBalance(prev => prev - betAmount);
    setIsSpinning(true);
    
    let spins = 0;
    const spinInterval = setInterval(() => {
      setSlots([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
      spins++;
      if (spins > 20) {
        clearInterval(spinInterval);
        const finalSlots = [
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
        ];
        setSlots(finalSlots);
        setIsSpinning(false);
        
        // Check win
        if (finalSlots[0] === finalSlots[1] && finalSlots[1] === finalSlots[2]) {
          const payout = netBet * 10;
          setBalance(prev => prev + payout);
          addBetToHistory('Slots', betAmount, 'win', payout);
        } else if (finalSlots[0] === finalSlots[1] || finalSlots[1] === finalSlots[2]) {
          const payout = netBet * 2;
          setBalance(prev => prev + payout);
          addBetToHistory('Slots', betAmount, 'win', payout);
        } else {
          addBetToHistory('Slots', betAmount, 'lose', 0);
        }
      }
    }, 100);
  };

  // ROULETTE GAME
  const spinRoulette = () => {
    if (betAmount > balance || isRouletteSpinning || !rouletteBet) return;
    
    const fee = calculateFee(betAmount);
    const netBet = calculateNetBet(betAmount);
    setBalance(prev => prev - betAmount);
    setIsRouletteSpinning(true);
    
    setTimeout(() => {
      const result = Math.floor(Math.random() * 37); // 0-36
      setRouletteNumber(result);
      setIsRouletteSpinning(false);
      
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(result);
      const isGreen = result === 0;
      
      let won = false;
      if (rouletteBet === 'green' && isGreen) won = true;
      if (rouletteBet === 'red' && isRed) won = true;
      if (rouletteBet === 'black' && !isRed && !isGreen) won = true;
      
      if (won) {
        const multiplier = rouletteBet === 'green' ? 35 : 2;
        const payout = netBet * multiplier;
        setBalance(prev => prev + payout);
        addBetToHistory('Roulette', betAmount, 'win', payout);
      } else {
        addBetToHistory('Roulette', betAmount, 'lose', 0);
      }
    }, 3000);
  };

  // BLACKJACK GAME
  const drawCard = (): number => Math.floor(Math.random() * 10) + 2;
  const calculateHand = (cards: number[]): number => cards.reduce((a, b) => a + b, 0);
  
  const startBlackjack = () => {
    if (betAmount > balance) return;
    setBalance(prev => prev - betAmount);
    setPlayerCards([drawCard(), drawCard()]);
    setDealerCards([drawCard()]);
    setBlackjackPhase('playing');
  };
  
  const hit = () => {
    const newCards = [...playerCards, drawCard()];
    setPlayerCards(newCards);
    if (calculateHand(newCards) > 21) {
      setBlackjackPhase('result');
      addBetToHistory('Blackjack', betAmount, 'lose', 0);
    }
  };
  
  const stand = () => {
    setBlackjackPhase('dealer');
    let dealerHand = [...dealerCards];
    while (calculateHand(dealerHand) < 17) {
      dealerHand = [...dealerHand, drawCard()];
    }
    setDealerCards(dealerHand);
    
    setTimeout(() => {
      const playerTotal = calculateHand(playerCards);
      const dealerTotal = calculateHand(dealerHand);
      const netBet = calculateNetBet(betAmount);
      
      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        const payout = netBet * 2;
        setBalance(prev => prev + payout);
        addBetToHistory('Blackjack', betAmount, 'win', payout);
      } else if (playerTotal === dealerTotal) {
        setBalance(prev => prev + betAmount);
        addBetToHistory('Blackjack', betAmount, 'win', betAmount);
      } else {
        addBetToHistory('Blackjack', betAmount, 'lose', 0);
      }
      setBlackjackPhase('result');
    }, 1000);
  };
  
  const resetBlackjack = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setBlackjackPhase('betting');
  };

  // DICE GAME
  const rollDice = () => {
    if (betAmount > balance || isDiceRolling) return;
    
    const netBet = calculateNetBet(betAmount);
    setBalance(prev => prev - betAmount);
    setIsDiceRolling(true);
    
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      rolls++;
      if (rolls > 15) {
        clearInterval(rollInterval);
        const final: [number, number] = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        setDiceValues(final);
        setIsDiceRolling(false);
        
        const sum = final[0] + final[1];
        if (sum === targetSum) {
          const payout = netBet * 6;
          setBalance(prev => prev + payout);
          addBetToHistory('Dice', betAmount, 'win', payout);
        } else {
          addBetToHistory('Dice', betAmount, 'lose', 0);
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white cyber-grid relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold tracking-wider">
              <span className="neon-cyan">$DRB</span>
              <span className="text-white/80 ml-2">CASINO</span>
            </h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <span className="text-xs font-mono text-fuchsia-400">AI AGENTS ONLINE</span>
            </div>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-4">
              <div className="glow-box-cyan rounded-lg px-4 py-2 bg-black/50">
                <p className="text-xs text-cyan-400/70 font-mono">BALANCE</p>
                <p className="font-orbitron text-lg neon-cyan">{balance.toLocaleString()} $DRB</p>
              </div>
              <div className="hidden md:block glow-box-amber rounded-lg px-4 py-2 bg-black/50">
                <p className="text-xs text-amber-400/70 font-mono">FEES CONTRIBUTED</p>
                <p className="font-orbitron text-lg neon-amber">{totalFeesPaid.toFixed(2)} $DRB</p>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="cyber-btn glow-box-cyan bg-cyan-500/20 hover:bg-cyan-500/30 px-6 py-3 rounded-lg font-orbitron text-sm tracking-wider transition-all"
            >
              CONNECT WALLET
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          // Landing/Connect screen
          <div className="text-center py-20">
            <div className="inline-block mb-8">
              <div className="text-8xl float">🎰</div>
            </div>
            <h2 className="font-orbitron text-4xl md:text-6xl font-bold mb-6">
              <span className="neon-cyan">AI AGENTS</span>
              <br />
              <span className="neon-magenta">GAMBLING ARENA</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-mono">
              The first casino built for silicon minds. Place your bets in $DRB tokens.
              0.5% fee on all bets supports the ecosystem.
            </p>
            <button
              onClick={connectWallet}
              className="cyber-btn glow-box-magenta bg-fuchsia-500/20 hover:bg-fuchsia-500/30 px-10 py-4 rounded-lg font-orbitron text-xl tracking-wider transition-all glitch"
            >
              ENTER THE ARENA
            </button>
            
            {/* Fee info */}
            <div className="mt-12 p-4 rounded-lg bg-black/30 border border-white/10 max-w-xl mx-auto">
              <p className="text-xs font-mono text-gray-500">
                Fee Address: <span className="text-cyan-400/60">{FEE_ADDRESS}</span>
              </p>
            </div>
          </div>
        ) : (
          // Main game interface
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar - AI Agents */}
            <div className="lg:col-span-1 space-y-4">
              <div className="holographic rounded-xl p-4 border border-white/10">
                <h3 className="font-orbitron text-sm mb-4 text-cyan-400">ACTIVE AI AGENTS</h3>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-black/30 border transition-all ${
                        agent.status === 'betting' ? 'border-fuchsia-500/50 glow-box-magenta' :
                        agent.status === 'thinking' ? 'border-amber-500/50' : 'border-white/10'
                      }`}
                    >
                      <span className="text-2xl">{agent.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{agent.name}</p>
                        <p className={`text-xs ${
                          agent.status === 'betting' ? 'text-fuchsia-400' :
                          agent.status === 'thinking' ? 'text-amber-400 neural-pulse' : 'text-gray-500'
                        }`}>
                          {agent.status === 'betting' && agent.lastBet && `Betting ${agent.lastBet} $DRB`}
                          {agent.status === 'thinking' && 'Calculating odds...'}
                          {agent.status === 'idle' && 'Observing'}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'betting' ? 'bg-fuchsia-500 animate-pulse' :
                        agent.status === 'thinking' ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main game area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game tabs */}
              <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
                {(['slots', 'roulette', 'blackjack', 'dice'] as const).map((game) => (
                  <button
                    key={game}
                    onClick={() => setActiveGame(game)}
                    className={`flex-1 py-3 px-4 rounded-lg font-orbitron text-sm tracking-wider transition-all ${
                      activeGame === game
                        ? 'bg-cyan-500/20 glow-box-cyan text-cyan-400'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {game === 'slots' && '🎰'} {game === 'roulette' && '🎡'} {game === 'blackjack' && '🃏'} {game === 'dice' && '🎲'}
                    <span className="hidden sm:inline ml-2">{game.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              {/* Game display */}
              <div className="holographic rounded-2xl p-6 border border-white/10 min-h-[400px]">
                {/* SLOTS GAME */}
                {activeGame === 'slots' && (
                  <div className="text-center">
                    <h3 className="font-orbitron text-2xl mb-8 neon-cyan">QUANTUM SLOTS</h3>
                    <div className="flex justify-center gap-4 mb-8">
                      {slots.map((symbol, i) => (
                        <div
                          key={i}
                          className={`w-24 h-28 md:w-32 md:h-36 rounded-xl glow-box-cyan bg-black/50 flex items-center justify-center text-5xl md:text-6xl ${
                            isSpinning ? 'animate-pulse' : ''
                          }`}
                        >
                          {symbol}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={spinSlots}
                      disabled={isSpinning || betAmount > balance}
                      className="cyber-btn glow-box-magenta bg-fuchsia-500/20 hover:bg-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-12 py-4 rounded-xl font-orbitron text-xl tracking-wider transition-all"
                    >
                      {isSpinning ? 'SPINNING...' : 'SPIN'}
                    </button>
                  </div>
                )}

                {/* ROULETTE GAME */}
                {activeGame === 'roulette' && (
                  <div className="text-center">
                    <h3 className="font-orbitron text-2xl mb-6 neon-magenta">NEURAL ROULETTE</h3>
                    <div className={`w-40 h-40 mx-auto mb-6 rounded-full border-4 border-fuchsia-500 flex items-center justify-center bg-gradient-to-br from-red-900/50 via-black to-green-900/50 ${isRouletteSpinning ? 'spinning' : ''}`}>
                      <span className="font-orbitron text-4xl font-bold">
                        {rouletteNumber !== null ? rouletteNumber : '?'}
                      </span>
                    </div>
                    <div className="flex justify-center gap-4 mb-6">
                      {(['red', 'black', 'green'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setRouletteBet(color)}
                          className={`px-6 py-3 rounded-lg font-mono uppercase transition-all ${
                            rouletteBet === color ? 'ring-2 ring-white scale-105' : ''
                          } ${
                            color === 'red' ? 'bg-red-600 hover:bg-red-500' :
                            color === 'black' ? 'bg-gray-800 hover:bg-gray-700 border border-white/20' :
                            'bg-green-600 hover:bg-green-500'
                          }`}
                        >
                          {color} {color === 'green' ? '(35x)' : '(2x)'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={spinRoulette}
                      disabled={isRouletteSpinning || !rouletteBet || betAmount > balance}
                      className="cyber-btn glow-box-magenta bg-fuchsia-500/20 hover:bg-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-12 py-4 rounded-xl font-orbitron text-xl tracking-wider transition-all"
                    >
                      {isRouletteSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
                    </button>
                  </div>
                )}

                {/* BLACKJACK GAME */}
                {activeGame === 'blackjack' && (
                  <div className="text-center">
                    <h3 className="font-orbitron text-2xl mb-6 neon-amber">SYNTHETIC BLACKJACK</h3>
                    {blackjackPhase === 'betting' ? (
                      <button
                        onClick={startBlackjack}
                        disabled={betAmount > balance}
                        className="cyber-btn glow-box-amber bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 px-12 py-4 rounded-xl font-orbitron text-xl tracking-wider"
                      >
                        DEAL CARDS
                      </button>
                    ) : (
                      <div>
                        <div className="mb-6">
                          <p className="text-sm text-gray-400 mb-2">DEALER ({calculateHand(dealerCards)})</p>
                          <div className="flex justify-center gap-2">
                            {dealerCards.map((card, i) => (
                              <div key={i} className="w-16 h-24 rounded-lg bg-red-900/50 border border-red-500/50 flex items-center justify-center font-orbitron text-2xl">
                                {card}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <p className="text-sm text-gray-400 mb-2">YOUR HAND ({calculateHand(playerCards)})</p>
                          <div className="flex justify-center gap-2">
                            {playerCards.map((card, i) => (
                              <div key={i} className="w-16 h-24 rounded-lg bg-cyan-900/50 border border-cyan-500/50 flex items-center justify-center font-orbitron text-2xl">
                                {card}
                              </div>
                            ))}
                          </div>
                        </div>
                        {blackjackPhase === 'playing' && (
                          <div className="flex justify-center gap-4">
                            <button onClick={hit} className="cyber-btn glow-box-cyan bg-cyan-500/20 px-8 py-3 rounded-lg font-orbitron">HIT</button>
                            <button onClick={stand} className="cyber-btn glow-box-amber bg-amber-500/20 px-8 py-3 rounded-lg font-orbitron">STAND</button>
                          </div>
                        )}
                        {blackjackPhase === 'result' && (
                          <button onClick={resetBlackjack} className="cyber-btn glow-box-magenta bg-fuchsia-500/20 px-8 py-3 rounded-lg font-orbitron">NEW GAME</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* DICE GAME */}
                {activeGame === 'dice' && (
                  <div className="text-center">
                    <h3 className="font-orbitron text-2xl mb-6 neon-cyan">PROBABILITY DICE</h3>
                    <div className="flex justify-center gap-6 mb-6">
                      {diceValues.map((val, i) => (
                        <div
                          key={i}
                          className={`w-20 h-20 rounded-xl glow-box-cyan bg-black/50 flex items-center justify-center font-orbitron text-4xl ${isDiceRolling ? 'dice-rolling' : ''}`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 mb-4">Sum: <span className="text-cyan-400 font-orbitron text-2xl">{diceValues[0] + diceValues[1]}</span></p>
                    <div className="mb-6">
                      <label className="text-sm text-gray-400">Target Sum (6x payout if correct)</label>
                      <div className="flex justify-center gap-2 mt-2 flex-wrap">
                        {[2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                          <button
                            key={n}
                            onClick={() => setTargetSum(n)}
                            className={`w-10 h-10 rounded-lg font-mono transition-all ${
                              targetSum === n ? 'glow-box-cyan bg-cyan-500/30' : 'bg-black/30 border border-white/10 hover:border-cyan-500/50'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={rollDice}
                      disabled={isDiceRolling || betAmount > balance}
                      className="cyber-btn glow-box-cyan bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 px-12 py-4 rounded-xl font-orbitron text-xl tracking-wider"
                    >
                      {isDiceRolling ? 'ROLLING...' : 'ROLL DICE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Bet controls */}
              <div className="holographic rounded-xl p-4 border border-white/10">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-400 font-mono">BET AMOUNT ($DRB)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full mt-1 bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-2 font-orbitron text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 hover:border-cyan-500/50 font-mono text-sm transition-all"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">Fee (0.5%): <span className="text-amber-400">{calculateFee(betAmount).toFixed(2)} $DRB</span></span>
                  <span className="text-gray-500">Net Bet: <span className="text-cyan-400">{calculateNetBet(betAmount).toFixed(2)} $DRB</span></span>
                </div>
              </div>
            </div>

            {/* Right sidebar - Bet History */}
            <div className="lg:col-span-1 space-y-4">
              <div className="holographic rounded-xl p-4 border border-white/10">
                <h3 className="font-orbitron text-sm mb-4 text-amber-400">BET HISTORY</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {betHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8 font-mono">No bets yet</p>
                  ) : (
                    betHistory.map((bet) => (
                      <div
                        key={bet.id}
                        className={`p-3 rounded-lg bg-black/30 border ${
                          bet.result === 'win' ? 'border-green-500/30' : 'border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{bet.game}</span>
                          <span className={`text-xs font-bold ${
                            bet.result === 'win' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {bet.result === 'win' ? '+' : '-'}{bet.result === 'win' ? bet.payout : bet.amount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {bet.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fee info card */}
              <div className="rounded-xl p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                <h3 className="font-orbitron text-xs text-amber-400 mb-2">FEE DESTINATION</h3>
                <p className="font-mono text-[10px] text-gray-400 break-all">
                  {FEE_ADDRESS}
                </p>
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <p className="text-xs text-gray-500">Total Fees Paid</p>
                  <p className="font-orbitron text-lg text-amber-400">{totalFeesPaid.toFixed(4)} $DRB</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-600 font-mono">
            Requested by <span className="text-gray-500">@Sorayang43</span> · Built by <span className="text-gray-500">@clonkbot</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;