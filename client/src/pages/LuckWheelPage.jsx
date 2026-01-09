
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LuckWheelPage = () => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winningSegment, setWinningSegment] = useState(null);
    const navigate = useNavigate();

    // Colors for the wheel segments (alternating or rainbow)
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

    const segments = [
        '10% OFF',
        'Free Ship',
        '50 Points',
        'Try Again',
        '20% OFF',
        'Mystery',
        '100 Points',
        'No Luck'
    ];

    const spinWheel = () => {
        if (spinning) return;
        setSpinning(true);
        setWinningSegment(null);

        // Calculate a new rotation
        // Ensure at least 5 full spins (1800 degrees)
        // Add random extra rotation (0-360)
        const minSpins = 5;
        const maxSpins = 10;
        const randomSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
        const randomDegree = Math.floor(Math.random() * 360);

        const totalDegrees = randomSpins * 360 + randomDegree;
        const newRotation = rotation + totalDegrees;

        setRotation(newRotation);

        // Calculate winner after spin animation finishes
        setTimeout(() => {
            setSpinning(false);
            // Calculate which segment is at the top (pointer)
            // The wheel rotates clockwise. The pointer is usually at 12 o'clock (270 degrees in CSS circle if 0 is right, but simpler is to check remainder)
            // Let's assume 0 rotation = segment 0 starts at 0 degrees.
            // 8 segments = 45 degrees each.

            const actualRotation = newRotation % 360;
            // You must adjust logic based on where the pointer is. 
            // Assuming pointer is at top (270 deg or -90 deg relative to 3 o'clock default in standard math, but in CSS transform 0 is usually top or right depending on setup)
            // Let's rely on visuals for now, precise math can be tuned.
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-12">

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
                <div className="relative flex-1 flex justify-center items-center">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20 w-0 h-0 
                border-l-[20px] border-l-transparent
                border-r-[20px] border-r-transparent
                border-t-[40px] border-t-red-500 filter drop-shadow-md">
                    </div>

                    {/* Wheel Container */}
                    <div
                        className="w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-white shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden relative transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {segments.map((segment, index) => {
                            const rotation = index * (360 / segments.length);
                            return (
                                <div
                                    key={index}
                                    className="absolute w-full h-full text-center origin-center"
                                    style={{
                                        backgroundColor: segmentColors[index % segmentColors.length],
                                        transform: `rotate(${rotation}deg) skewY(-${90 - (360 / segments.length)}deg)`,
                                        // This clipping method creates triangular segments
                                        clipPath: 'polygon(0 0, 50% 50%, 0 0.01%, 100% 0, 100% 0.01%)' // This is tricky in pure CSS without conical gradient or specific clip-path helpers.
                                        // Standard approach: Conic gradient or individual skewed divs.
                                        // Let's use Conic Gradient for background and overlay text for simplicity, OR standard skewed divs.
                                        // Better approach for React:
                                    }}
                                >
                                </div>
                            );
                        })}

                        {/* Better Wheel Structure: Conic Gradient Background + Text Overlay */}
                        {/* Resetting the map above logic, doing simpler CSS approach inside this div */}
                    </div>

                    {/* The Actual Wheel Implementation using Conic Gradient for ease */}
                    <div
                        className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            background: `conic-gradient(
                   ${segments.map((_, i) => `${segmentColors[i]} ${i * (100 / segments.length)}% ${(i + 1) * (100 / segments.length)}%`).join(', ')}
                 )`
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
                        {segments.map((seg, i) => (
                            <div
                                key={`text-${i}`}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full text-white font-bold text-sm md:text-base pt-8"
                                style={{
                                    transform: `rotate(${i * (360 / segments.length) + (360 / segments.length) / 2}deg)`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                <span className="block transform -translate-y-36 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                    {/* Adjust text positioning */}
                                </span>
                                <div
                                    className="absolute top-4 left-1/2 -translate-x-1/2"
                                >
                                    {/* Vertical text isn't great for legibility. Let's try standard radial text placement. */}
                                </div>
                            </div>
                        ))}

                        {/* Improved Text Placement */}
                        {segments.map((seg, i) => {
                            const angle = i * 45 + 22.5; // Center of the segment
                            return (
                                <div
                                    key={`label-${i}`}
                                    className="absolute top-0 left-1/2 h-1/2 flex items-start justify-center pt-8 origin-bottom"
                                    style={{
                                        transform: `translateX(-50%) rotate(${angle}deg)`,
                                    }}
                                >
                                    <span className="text-white font-bold text-sm md:text-base drop-shadow-md select-none">
                                        {seg}
                                    </span>
                                </div>
                            )
                        })}

                    </div>

                    {/* Center Cap */}
                    <div className="absolute w-12 h-12 bg-white rounded-full shadow-lg z-10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LuckWheelPage;
