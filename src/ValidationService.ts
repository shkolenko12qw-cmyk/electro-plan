import { Product, Item } from '../types';

export const ValidationService = {
  isCompatible: (frame: Item | Product | undefined, mechanism: Product | null): boolean => {
    if (!frame || !mechanism) return true;
    
    // Правило: Бренди повинні збігатися
    if (frame.brand !== mechanism.brand) return false;
    
    // Правило: Сумісність серій System 55
    if (mechanism.series === 'System 55') {
        const compatibleFrameSeries = ['E2', 'Esprit', 'Event', 'Standard 55', 'E2 Flat'];
        return compatibleFrameSeries.includes(frame.series);
    }
    
    // Тут можна додати інші правила (наприклад, для Jung або ABB)
    return true;
  }
};