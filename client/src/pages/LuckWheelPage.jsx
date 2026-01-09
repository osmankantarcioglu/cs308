
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LuckWheelPage = () => {
    const [spinning, setSpinning] = useState(false);
    const [segments, setSegments] = useState([]); // Array of objects: { text, code, type, color }
    const [rotation, setRotation] = useState(0);
    const [winningResult, setWinningResult] = useState(null); // The result object after spin
    const navigate = useNavigate();

    const segmentColors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEEAD', // Yellow
        '#D4A5A5', // Pink
        '#9B59B6', // Purple
        '#3498DB', // Dark Blue
    ];



    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await fetch('http://localhost:3000/coupons');
                const data = await res.json();

                // Initialize 8 segments as 'Out of Luck'
                let wheelSegments = Array(8).fill(null).map(() => ({
                    text: 'Out of Luck',
                    type: 'loss'
                }));

                if (data.success && data.data) {
                    const availableCoupons = data.data;
                    const count = Math.min(availableCoupons.length, 6); // Max 6 coupons

                    // User specified mapping (1-based -> 0-based array index)
                    // 1st coupon -> Index 0 (1)
                    // 2nd coupon -> Index 2 (3)
                    // 3rd coupon -> Index 4 (5)
                    // 4th coupon -> Index 6 (7)
                    // 5th coupon -> Index 7 (8)
                    // 6th coupon -> Index 1 (2)
                    const placementIndices = [0, 2, 4, 6, 7, 1];

                    for (let i = 0; i < count; i++) {
                        const coupon = availableCoupons[i];
                        const targetIndex = placementIndices[i];

                        wheelSegments[targetIndex] = {
                            text: `${coupon.discount_rate}% OFF`,
                            code: coupon.code,
                            type: 'win'
                        };
                    }
                } else {
                    // Fallback if no data, purely decorative
                    wheelSegments = Array(8).fill(null).map((_, i) => ({
                        text: i % 2 === 0 ? 'Try Again' : 'No Luck',
                        type: 'loss'
                    }));
                }

                // Assign colors sequentially
                const finalSegments = wheelSegments.map((seg, i) => ({
                    ...seg,
                    color: segmentColors[i % segmentColors.length]
                }));

                setSegments(finalSegments);

            } catch (err) {
                console.error("Failed to fetch coupons", err);
                const fallback = Array(8).fill(null).map((_, i) => ({
                    text: i % 2 === 0 ? 'Try Again' : 'No Luck',
                    type: 'loss',
                    color: segmentColors[i % segmentColors.length]
                }));
                setSegments(fallback);
            }
        };

        fetchCoupons();
    }, []);

    const spinWheel = () => {
        if (spinning || segments.length === 0) return;
        setSpinning(true);
        setWinningResult(null);

        // Calculate a new rotation
        const minSpins = 5;
        const maxSpins = 10;
        const randomSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
        const randomDegree = Math.floor(Math.random() * 360);

        const totalDegrees = randomSpins * 360 + randomDegree;
        const newRotation = rotation + totalDegrees;

        setRotation(newRotation);

        setTimeout(() => {
            setSpinning(false);

            // Calculate winner
            // The pointer is at the TOP (0 degrees visual, or 270 in standard math context).
            // Our CSS rotation rotates the wheel clockwise.
            // If we rotate X degrees, the slice at the top is determined by:
            // (360 - (X % 360)) % 360.
            // Then divide by slice size.

            const degreesRotated = newRotation % 360;
            // Adjustment: standard CSS transform rotate(0) usually puts index 0 at 12 o'clock, 
            // BUT our segments setup might differ. 
            // In the render: index 0 is at 0 degrees.
            // If we rotate 90 deg clockwise, index 0 moves to 3 o'clock. 
            // The pointer is at 12 o'clock. 
            // So we need the segment that is at 0 degrees relative to the wheel's new position.
            // Which is (360 - degreesRotated).

            const segmentAngle = 360 / segments.length;
            const winningIndex = Math.floor(((360 - degreesRotated) % 360) / segmentAngle);

            setWinningResult(segments[winningIndex]);

        }, 5000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">

                {/* Result Overlay */}
                {winningResult && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
                            <div className="mb-4 text-6xl">
                                {winningResult.type === 'win' ? '🎉' : '😢'}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {winningResult.type === 'win' ? 'Congratulations!' : 'So Close!'}
                            </h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                {winningResult.type === 'win'
                                    ? `You won ${winningResult.text}!`
                                    : 'Better luck next time!'}
                            </p>

                            {winningResult.type === 'win' && winningResult.code && (
                                <div className="bg-gray-100 p-4 rounded-xl mb-6 border-2 border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-semibold">Your Coupon Code</p>
                                    <div className="text-2xl font-mono font-bold text-blue-600 tracking-wider select-all">
                                        {winningResult.code}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setWinningResult(null)}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                {winningResult.type === 'win' ? 'Awesome!' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Left Side: Text & Actions */}
                <div className="flex-1 text-center md:text-left space-y-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
                    >
                        ← Back to Home
                    </button>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                        Spin & Win!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Try your luck to win exclusive discounts, free shipping, and loyalty points.
                        Spin the wheel now!
                    </p>

                    <button
                        onClick={spinWheel}
                        disabled={spinning}
                        className={`
                            px-10 py-4 rounded-full text-xl font-bold shadow-lg transform transition-all
                            ${spinning
                                ? 'bg-gray-300 cursor-not-allowed scale-95'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 hover:shadow-xl active:scale-95'
                            }
                        `}
                    >
                        {spinning ? 'Spinning...' : 'SPIN NOW'}
                    </button>
                </div>

                {/* Right Side: The Wheel */}
                <div className="relative flex-1 flex justify-center items-center py-8">
                    {/* Pointer */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 
                        border-l-[20px] border-l-transparent
                        border-r-[20px] border-r-transparent
                        border-t-[40px] border-t-red-500 filter drop-shadow-md">
                    </div>

                    {/* Wheel Container */}
                    <div className="relative w-80 h-80 md:w-96 md:h-96">
                        <div
                            className="w-full h-full rounded-full border-8 border-white shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                background: segments.length > 0 ? `conic-gradient(
                                    ${segments.map((s, i) => `${s.color} ${i * (100 / segments.length)}% ${(i + 1) * (100 / segments.length)}%`).join(', ')}
                                )` : '#eee'
                            }}
                        >
                            {/* Lines separating segments */}
                            {segments.map((_, i) => (
                                <div
                                    key={`line-${i}`}
                                    className="absolute w-full h-1 bg-white/20 top-1/2 left-0 -translate-y-1/2 origin-center"
                                    style={{ transform: `rotate(${i * (360 / segments.length)}deg)` }}
                                />
                            ))}

                            {/* Text Labels */}
                            {segments.map((seg, i) => {
                                const angle = i * (360 / segments.length) + (360 / segments.length) / 2;
                                return (
                                    <div
                                        key={`label-${i}`}
                                        className="absolute top-0 left-1/2 h-1/2 flex items-start justify-center pt-8 origin-bottom"
                                        style={{
                                            transform: `translateX(-50%) rotate(${angle}deg)`,
                                        }}
                                    >
                                        <span className="text-white font-bold text-sm md:text-base drop-shadow-md select-none max-w-[80px] text-center leading-tight">
                                            {seg.text}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        {/* Center Cap */}
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
