
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LuckWheelPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [spinning, setSpinning] = useState(false);
    const [segments, setSegments] = useState([]);
    const [rotation, setRotation] = useState(0);
    const [winningResult, setWinningResult] = useState(null);
    const [canSpin, setCanSpin] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    const segmentColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];

    useEffect(() => {
        // Fetch coupons and check spin status
        const fetchData = async () => {
            // 1. Fetch Coupons
            try {
                const res = await fetch('http://localhost:3000/coupons');
                const data = await res.json();

                let wheelSegments = Array(8).fill(null).map(() => ({
                    text: 'Out of Luck',
                    type: 'loss'
                }));

                if (data.success && data.data) {
                    const availableCoupons = data.data;
                    const count = Math.min(availableCoupons.length, 6);
                    const placementIndices = [0, 2, 4, 6, 7, 1];

                    for (let i = 0; i < count; i++) {
                        wheelSegments[placementIndices[i]] = {
                            text: `${availableCoupons[i].discount_rate}% OFF`,
                            code: availableCoupons[i].code,
                            type: 'win'
                        };
                    }
                }

                setSegments(wheelSegments.map((seg, i) => ({
                    ...seg,
                    color: segmentColors[i % segmentColors.length]
                })));

            } catch (err) {
                console.error("Failed to fetch coupons", err);
            }

            // 2. Check User Status
            if (user?.last_spin_at) {
                const lastSpin = new Date(user.last_spin_at);
                const nextSpin = new Date(lastSpin.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                const now = new Date();

                if (now < nextSpin) {
                    setCanSpin(false);
                    const diff = nextSpin - now;
                    setTimeLeft(diff);
                } else {
                    setCanSpin(true);
                }
            } else {
                setCanSpin(true);
            }
        };

        fetchData();
    }, [user]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1000) {
                        clearInterval(timer);
                        setCanSpin(true);
                        return null;
                    }
                    return prev - 1000;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const formatTime = (ms) => {
        if (!ms) return '';
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const spinWheel = async () => {
        if (spinning || segments.length === 0 || !canSpin) return;

        // Call API to register spin
        try {
            const res = await fetch('http://localhost:3000/coupons/spin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (!data.success) {
                alert(data.message);
                return;
            }

            // If success, start animation
            setSpinning(true);
            setWinningResult(null);

            const minSpins = 5;
            const maxSpins = 10;
            const randomSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
            const randomDegree = Math.floor(Math.random() * 360);
            const totalDegrees = randomSpins * 360 + randomDegree;
            const newRotation = rotation + totalDegrees;

            setRotation(newRotation);

            setTimeout(() => {
                setSpinning(false);
                const degreesRotated = newRotation % 360;
                const segmentAngle = 360 / segments.length;
                const winningIndex = Math.floor(((360 - degreesRotated) % 360) / segmentAngle);

                setWinningResult(segments[winningIndex]);
                setCanSpin(false);
                // Set timer for next week immediately
                setTimeLeft(7 * 24 * 60 * 60 * 1000);

            }, 5000);

        } catch (err) {
            console.error("Spin failed", err);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">

                {winningResult && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                            <div className="mb-4 text-6xl">
                                {winningResult.type === 'win' ? '🎉' : '😢'}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {winningResult.type === 'win' ? 'Congratulations!' : 'So Close!'}
                            </h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                {winningResult.type === 'win' ? `You won ${winningResult.text}!` : 'Better luck next time!'}
                            </p>
                            {winningResult.type === 'win' && winningResult.code && (
                                <div className="bg-gray-100 p-4 rounded-xl mb-6 border-2 border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500 mb-1 font-semibold">Your Coupon Code</p>
                                    <div className="text-2xl font-mono font-bold text-blue-600 select-all">
                                        {winningResult.code}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => setWinningResult(null)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 text-center md:text-left space-y-6">
                    <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
                        ← Back to Home
                    </button>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                        Spin & Win!
                    </h1>

                    {!canSpin && timeLeft ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <p className="text-orange-800 font-semibold mb-1">Next free spin in:</p>
                            <p className="text-2xl font-mono font-bold text-orange-600">
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg text-gray-600">
                            Try your luck to win exclusive discounts!
                        </p>
                    )}

                    <button
                        onClick={spinWheel}
                        disabled={spinning || !canSpin}
                        className={`
                            px-10 py-4 rounded-full text-xl font-bold shadow-lg transform transition-all
                            ${(spinning || !canSpin)
                                ? 'bg-gray-300 cursor-not-allowed scale-95'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                            }
                        `}
                    >
                        {spinning ? 'Spinning...' : canSpin ? 'SPIN NOW' : 'Wait for Cooldown'}
                    </button>
                </div>

                <div className="relative flex-1 flex justify-center items-center py-8">
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 drop-shadow-md"></div>
                    <div className="relative w-80 h-80 md:w-96 md:h-96">
                        <div
                            className="w-full h-full rounded-full border-8 border-white shadow-xl overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                background: segments.length > 0 ? `conic-gradient(${segments.map((s, i) => `${s.color} ${i * (100 / segments.length)}% ${(i + 1) * (100 / segments.length)}%`).join(', ')})` : '#eee'
                            }}
                        >
                            {segments.map((_, i) => (
                                <div key={`line-${i}`} className="absolute w-full h-1 bg-white/20 top-1/2 left-0 -translate-y-1/2 origin-center" style={{ transform: `rotate(${i * (360 / segments.length)}deg)` }} />
                            ))}
                            {segments.map((seg, i) => {
                                const angle = i * (360 / segments.length) + (360 / segments.length) / 2;
                                return (
                                    <div key={`label-${i}`} className="absolute top-0 left-1/2 h-1/2 flex items-start justify-center pt-8 origin-bottom" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}>
                                        <span className="text-white font-bold text-xs md:text-sm drop-shadow-md select-none max-w-[60px] text-center leading-tight">
                                            {seg.text}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg z-10 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LuckWheelPage;
