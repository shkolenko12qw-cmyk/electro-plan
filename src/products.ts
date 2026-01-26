import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // Frames (Gira Esprit Black Aluminium)
  { id: 'esprit-1', sku: '0211126', name: 'Esprit Рамка 1-м (Чорний алюміній)', category: 'frame', series: 'Esprit', brand: 'Gira', color: '#1a1a1a', price: 70.01, width: 95, height: 95, gangs: 1 },
  { id: 'esprit-2', sku: '0212126', name: 'Esprit Рамка 2-м (Чорний алюміній)', category: 'frame', series: 'Esprit', brand: 'Gira', color: '#1a1a1a', price: 119.71, width: 166, height: 95, gangs: 2 },
  { id: 'esprit-3', sku: '0213126', name: 'Esprit Рамка 3-м (Чорний алюміній)', category: 'frame', series: 'Esprit', brand: 'Gira', color: '#1a1a1a', price: 199.58, width: 236.8, height: 95, gangs: 3 },
  { id: 'esprit-4', sku: '0214126', name: 'Esprit Рамка 4-м (Чорний алюміній)', category: 'frame', series: 'Esprit', brand: 'Gira', color: '#1a1a1a', price: 275.71, width: 308, height: 95, gangs: 4 },
  
  // Frames (Gira E2 Black Thermoplastic)
  { id: 'e2-black-1', sku: '021109', name: 'E2 Рамка 1-м (Чорний матовий)', category: 'frame', series: 'E2', brand: 'Gira', color: '#1a1a1a', price: 11.13, width: 80.8, height: 80.8, gangs: 1 },
  { id: 'e2-black-2', sku: '021209', name: 'E2 Рамка 2-м (Чорний матовий)', category: 'frame', series: 'E2', brand: 'Gira', color: '#1a1a1a', price: 16.90, width: 151.9, height: 80.8, gangs: 2 },
  { id: 'e2-black-3', sku: '021309', name: 'E2 Рамка 3-м (Чорний матовий)', category: 'frame', series: 'E2', brand: 'Gira', color: '#1a1a1a', price: 27.79, width: 223.4, height: 80.8, gangs: 3 },
  { id: 'e2-black-4', sku: '021409', name: 'E2 Рамка 4-м (Чорний матовий)', category: 'frame', series: 'E2', brand: 'Gira', color: '#1a1a1a', price: 45.14, width: 294.7, height: 80.8, gangs: 4 },
  { id: 'e2-black-5', sku: '021509', name: 'E2 Рамка 5-м (Чорний матовий)', category: 'frame', series: 'E2', brand: 'Gira', color: '#1a1a1a', price: 68.69, width: 366.0, height: 80.8, gangs: 5 },

  // Frames (Gira E2 Flat Steel)
  { id: 'e2-flat-steel-1', sku: '0211335', name: 'E2 Flat Рамка 1-м (Сталь)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#434b4d', price: 0, width: 87.8, height: 87.8, gangs: 1 },
  { id: 'e2-flat-steel-2', sku: '0212335', name: 'E2 Flat Рамка 2-м (Сталь)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#434b4d', price: 0, width: 158.9, height: 87.8, gangs: 2 },
  { id: 'e2-flat-steel-3', sku: '0213335', name: 'E2 Flat Рамка 3-м (Сталь)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#434b4d', price: 0, width: 230.3, height: 87.8, gangs: 3 },
  { id: 'e2-flat-steel-4', sku: '0214335', name: 'E2 Flat Рамка 4-м (Сталь)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#434b4d', price: 0, width: 301.5, height: 87.8, gangs: 4 },

  // Frames (Gira E2 Flat Anthracite)
  { id: 'e2-flat-anth-1', sku: '0211235', name: 'E2 Flat Рамка 1-м (Антрацит)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#383e42', price: 0, width: 87.8, height: 87.8, gangs: 1 },
  { id: 'e2-flat-anth-2', sku: '0212235', name: 'E2 Flat Рамка 2-м (Антрацит)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#383e42', price: 0, width: 158.9, height: 87.8, gangs: 2 },
  { id: 'e2-flat-anth-3', sku: '0213235', name: 'E2 Flat Рамка 3-м (Антрацит)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#383e42', price: 0, width: 230.3, height: 87.8, gangs: 3 },
  { id: 'e2-flat-anth-4', sku: '0214235', name: 'E2 Flat Рамка 4-м (Антрацит)', category: 'frame', series: 'E2 Flat', brand: 'Gira', color: '#383e42', price: 0, width: 301.5, height: 87.8, gangs: 4 },

  // Mechanisms (System 55)
  { id: 'sys55-socket-black', sku: '4188005', name: 'Розетка (Чорний матовий)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#1a1a1a', price: 20.65, width: 55, height: 55, shape: 'socket' },
  { id: 'sys55-socket-ip44', sku: '4454005', name: 'Розетка з кришкою IP44 (Чорний матовий)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#1a1a1a', price: 33.46, width: 55, height: 55, shape: 'socket' },
  { 
    id: 'sys55-switch-1g-set', 
    sku: '3296005',
    name: 'Вимикач 1-кл (Комплект)', 
    category: 'switch', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#1a1a1a', 
    price: 25.40, 
    width: 55, 
    height: 55, 
    shape: 'switch',
    bomComponents: [
      { name: 'Вимикач 1-кл (Механізм)', sku: '310600', price: 12.88 },
      { name: 'Клавіша 1-кл (Чорний матовий)', sku: '3296005', price: 12.52 }
    ]
  },
  { 
    id: 'sys55-switch-2g-set', 
    sku: '3295005',
    name: 'Вимикач 2-кл (Комплект)', 
    category: 'switch', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#1a1a1a', 
    price: 38.43, 
    width: 55, 
    height: 55, 
    shape: 'switch',
    bomComponents: [
      { name: 'Вимикач 2-кл (Механізм)', sku: '310500', price: 20.43 },
      { name: 'Клавіша 2-кл (Чорний матовий)', sku: '3295005', price: 18.00 }
    ]
  },

  // Sockets (System 55 - New Colors)
  { id: 'sys55-socket-anth', sku: '418828', name: 'Розетка (Антрацит)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#383e42', price: 0, width: 55, height: 55, shape: 'socket' },
  { id: 'sys55-socket-steel', sku: '4188600', name: 'Розетка (Сталь)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#434b4d', price: 0, width: 55, height: 55, shape: 'socket' },

  // Switches (System 55 - New Colors)
  { 
    id: 'sys55-switch-1g-anth', 
    sku: '329628', 
    name: 'Вимикач 1-кл (Антрацит)', 
    category: 'switch', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#383e42', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'switch',
    bomComponents: [
      { name: 'Вимикач 1-кл (Механізм)', sku: '310600', price: 0 },
      { name: 'Клавіша 1-кл (Антрацит)', sku: '329628', price: 0 }
    ]
  },
  { 
    id: 'sys55-switch-2g-anth', 
    sku: '329528', 
    name: 'Вимикач 2-кл (Антрацит)', 
    category: 'switch', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#383e42', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'switch',
    bomComponents: [
      { name: 'Вимикач 2-кл (Механізм)', sku: '310500', price: 0 },
      { name: 'Клавіша 2-кл (Антрацит)', sku: '329528', price: 0 }
    ]
  },
  { 
    id: 'sys55-switch-1g-steel', 
    sku: '3296600', 
    name: 'Вимикач 1-кл (Сталь)', 
    category: 'switch', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#434b4d', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'switch',
    bomComponents: [
      { name: 'Вимикач 1-кл (Механізм)', sku: '310600', price: 0 },
      { name: 'Клавіша 1-кл (Сталь)', sku: '3296600', price: 0 }
    ]
  },

  // Internet Sockets (RJ45)
  { 
    id: 'sys55-rj45-1g-anth', 
    sku: '245100-28', 
    name: 'Інтернет розетка 1-порт (Антрацит)', 
    category: 'socket', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#383e42', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'socket',
    bomComponents: [
      { name: 'Механізм RJ45 1-порт', sku: '245100', price: 0 },
      { name: 'Накладка на інтернет розетку (Антрацит)', sku: '027028', price: 0 }
    ]
  },
  { 
    id: 'sys55-rj45-2g-anth', 
    sku: '245200-28', 
    name: 'Інтернет розетка 2-порт (Антрацит)', 
    category: 'socket', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#383e42', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'socket',
    bomComponents: [
      { name: 'Механізм RJ45 2-порт', sku: '245200', price: 0 },
      { name: 'Накладка на інтернет розетку (Антрацит)', sku: '027028', price: 0 }
    ]
  },
  { 
    id: 'sys55-rj45-1g-alu', 
    sku: '245100-26', 
    name: 'Інтернет розетка 1-порт (Алюміній)', 
    category: 'socket', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#d0d0d0', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'socket',
    bomComponents: [
      { name: 'Механізм RJ45 1-порт', sku: '245100', price: 0 },
      { name: 'Накладка на інтернет розетку (Алюміній)', sku: '027026', price: 0 }
    ]
  },
  { 
    id: 'sys55-rj45-2g-alu', 
    sku: '245200-26', 
    name: 'Інтернет розетка 2-порт (Алюміній)', 
    category: 'socket', 
    brand: 'Gira', 
    series: 'System 55', 
    color: '#d0d0d0', 
    price: 0, 
    width: 55, 
    height: 55, 
    shape: 'socket',
    bomComponents: [
      { name: 'Механізм RJ45 2-порт', sku: '245200', price: 0 },
      { name: 'Накладка на інтернет розетку (Алюміній)', sku: '027026', price: 0 }
    ]
  },

  // Sockets IP44
  { id: 'sys55-socket-ip44-anth', sku: '445428', name: 'Розетка з кришкою IP44 (Антрацит)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#383e42', price: 0, width: 55, height: 55, shape: 'socket' },
  { id: 'sys55-socket-ip44-steel', sku: '4454600', name: 'Розетка з кришкою IP44 (Сталь)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#434b4d', price: 0, width: 55, height: 55, shape: 'socket' },

  // Sockets USB
  { id: 'sys55-socket-usb-black', sku: '2459005', name: 'Розетка з USB A+C (Чорний матовий)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#1a1a1a', price: 0, width: 55, height: 55, shape: 'socket' },
  { id: 'sys55-socket-usb-anth', sku: '245928', name: 'Розетка з USB A+C (Антрацит)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#383e42', price: 0, width: 55, height: 55, shape: 'socket' },
  { id: 'sys55-socket-usb-steel', sku: '2459600', name: 'Розетка з USB A+C (Сталь)', category: 'socket', brand: 'Gira', series: 'System 55', color: '#434b4d', price: 0, width: 55, height: 55, shape: 'socket' },
];