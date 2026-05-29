import React, { useState } from 'react';

const AuthBackground = ({ theme = 'default' }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const tiles = Array.from({ length: 120 });

  const baseColor = theme === 'teal' ? 'bg-teal-200/50' : 'bg-indigo-200/50';
  
  const hoverColor = theme === 'teal' ? 'bg-teal-500/80' : 'bg-[#2b3896]/80';

  return (
    <div className="absolute inset-0 grid gap-[2px] p-2 grid-cols-12 grid-rows-[10] [perspective:500px] z-0 overflow-hidden bg-gray-50">
      {tiles.map((_, index) => (
        <div
          key={index}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
          className={`rounded-lg transition-all ${
            hoverIndex === index
              ? `transform [transform:translateZ(30px)] shadow-lg duration-200 ${hoverColor}`
              : `${baseColor} duration-1000`
          }`}
        ></div>
      ))}
    </div>
  );
};

export default AuthBackground;