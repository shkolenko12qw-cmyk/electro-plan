export type Category = 'frame' | 'socket' | 'switch';
export type Brand = 'Gira' | 'Jung' | 'ABB' | 'Інше';

export interface BOMComponent {
  name: string;
  sku: string;
  price: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  series: string;
  brand: Brand;
  color: string;
  price: number;
  width: number;
  height: number;
  gangs?: number;
  shape?: 'socket' | 'switch';
  bomComponents?: BOMComponent[];
}

export interface Item extends Product {
  uniqueId: string;
  x?: number;
  y?: number;
  rotation?: number;
  slots?: (Product | null)[];
  isPinned?: boolean;
  assignedRoomId?: string;
  wallType?: 'brick' | 'gypsum';
}

export interface Room {
  id: string;
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
}

export interface BOMData {
  items: Record<string, { count: number; price: number; sku: string }>;
  total: number;
  byRoom: Record<string, Record<string, { 
    count: number; 
    price: number; 
    sku: string; 
    isAuto?: boolean 
  }>>;
}