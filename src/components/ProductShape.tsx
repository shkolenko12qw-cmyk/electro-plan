import React from 'react';
import { Item } from '../types';

interface FrameShapeProps {
    item: Item;
    isSelected: boolean;
    onSlotClick: (index: number) => void;
}

const FrameShape: React.FC<FrameShapeProps> = ({ item, isSelected, onSlotClick }) => {
    const pitch = 71;
    const slotSize = 55;
    
    // Визначаємо орієнтацію рамки (горизонтальна, якщо ширина >= висоти)
    const isHorizontal = item.width >= item.height;

    const centerX = item.width / 2;
    const centerY = item.height / 2;
    
    // Розрахунок початкової позиції для слотів
    const startX = isHorizontal ? centerX - ((item.gangs! - 1) * pitch) / 2 : centerX;
    const startY = isHorizontal ? centerY : centerY - ((item.gangs! - 1) * pitch) / 2;

    // Шлях до зображення (припускаємо, що файли лежать в public/images/ і мають розширення .jpg)
    const imagePath = `/images/${item.sku}.jpg`;

    // Логіка для винятку: якщо рамка повернута на ~90 градусів, механізми залишаються горизонтальними
    const rotation = item.rotation || 0;
    const normalizedRotation = (rotation % 360 + 360) % 360;
    const counterRotation = Math.abs(normalizedRotation - 90) <= 2 ? -rotation : 0;

    return (
        <g>
            <rect width={item.width} height={item.height} fill={item.color} rx={2} />
            <image href={imagePath} width={item.width} height={item.height} preserveAspectRatio="none" />
            {(isSelected || item.isPinned) && <rect width={item.width} height={item.height} fill="none" rx={2} stroke={isSelected ? '#3b82f6' : '#f97316'} strokeWidth={2} strokeDasharray={item.isPinned ? "4 2" : "none"} />}
            
            {Array.from({ length: item.gangs || 1 }).map((_, i) => {
                const x = isHorizontal ? startX + i * pitch : startX;
                const y = isHorizontal ? startY : startY + i * pitch;
                
                const mech = item.slots ? item.slots[i] : null;
                return (
                    <g key={i} transform={`translate(${x}, ${y})`}>
                        {/* Slot Hole */}
                        <rect x={-slotSize/2} y={-slotSize/2} width={slotSize} height={slotSize} fill="#111" rx={1} />
                        
                        <g transform={`rotate(${counterRotation})`}>
                            {mech ? (
                                <g onClick={(e) => { e.stopPropagation(); onSlotClick(i); }}>
                                    <rect x={-slotSize/2} y={-slotSize/2} width={slotSize} height={slotSize} fill={mech.color} rx={2} />
                                    <image href={`/images/${mech.sku}.jpg`} x={-slotSize/2} y={-slotSize/2} width={slotSize} height={slotSize} />
                                </g>
                            ) : (
                                <g onClick={(e) => { e.stopPropagation(); onSlotClick(i); }} style={{ cursor: 'pointer' }}>
                                    <rect x={-slotSize/2} y={-slotSize/2} width={slotSize} height={slotSize} fill="transparent" stroke="#555" strokeDasharray="4 2" />
                                    <line x1={0} y1={-8} x2={0} y2={8} stroke="#555" strokeWidth={2} />
                                    <line x1={-8} y1={0} x2={8} y2={0} stroke="#555" strokeWidth={2} />
                                </g>
                            )}
                        </g>
                    </g>
                );
            })}
        </g>
    );
};

interface ProductShapeProps {
    item: Item;
    isSelected: boolean;
    onSlotClick: (index: number) => void;
}

export const ProductShape: React.FC<ProductShapeProps> = ({ item, isSelected, onSlotClick }) => {
  const strokeColor = isSelected ? '#3b82f6' : (item.isPinned ? '#f97316' : 'transparent');
  const isRound = item.series === 'E3';
  const imagePath = `/images/${item.sku}.jpg`;

  if (item.category === 'frame') {
      return <FrameShape item={item} isSelected={isSelected} onSlotClick={onSlotClick} />;
  }
  
  // Спільний рендер для розеток та вимикачів
  if (item.shape === 'socket' || item.shape === 'switch') {
    return (
      <g>
        {isSelected && (
          <rect x={-2} y={-2} width={item.width + 4} height={item.height + 4} fill="none" stroke={strokeColor} strokeWidth={2} vectorEffect="non-scaling-stroke" rx={isRound ? 8 : 4} />
        )}
        {item.isPinned && (
          <rect x={0} y={0} width={item.width} height={item.height} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="4 2" rx={isRound ? 6 : 2} />
        )}
        <rect width={item.width} height={item.height} fill={item.color} rx={isRound ? 6 : 2} />
        <image href={imagePath} width={item.width} height={item.height} />
      </g>
    );
  }
  
  return <rect width={50} height={50} fill="red" />;
};