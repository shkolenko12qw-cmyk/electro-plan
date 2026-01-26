import { Item, Room, BOMData, Product } from './types';
import { getItemBounds, isPointInPolygon } from './helpers';

// Правила комплектації для E2 Flat
const E2_FLAT_BOXES: Record<string, Record<number, { sku: string, name: string }>> = {
    hollow: { 1: { sku: '289600', name: 'Монтажна коробка для гіпсових стін 1-м' }, 2: { sku: '289700', name: 'Монтажна коробка для гіпсових стін 2-м' }, 3: { sku: '289800', name: 'Монтажна коробка для гіпсових стін 3-м' }, 4: { sku: '289900', name: 'Монтажна коробка для гіпсових стін 4-м' } },
    masonry: { 1: { sku: '289100', name: 'Монтажна коробка для цегляних стін 1-м' }, 2: { sku: '289200', name: 'Монтажна коробка для цегляних стін 2-м' }, 3: { sku: '289300', name: 'Монтажна коробка для цегляних стін 3-м' }, 4: { sku: '289400', name: 'Монтажна коробка для цегляних стін 4-м' } }
};

export const BomService = {
    calculate: (items: Item[], rooms: Room[], products: Product[]) => {
        const bomData: BOMData = { items: {}, total: 0, byRoom: {} };
        const groups: any[] = []; // Тут можна відновити логіку групування рамок, якщо потрібно

        // Допоміжна функція додавання в BOM
        const addToBom = (name: string, price: number, sku: string, roomName: string, isAuto = false) => {
            bomData.total += price;
            
            // Загальний список
            if (!bomData.items[name]) bomData.items[name] = { count: 0, price, sku };
            bomData.items[name].count += 1;

            // По кімнатах
            if (!bomData.byRoom[roomName]) bomData.byRoom[roomName] = {};
            const roomList = bomData.byRoom[roomName];
            if (!roomList[name]) roomList[name] = { count: 0, price, sku, isAuto };
            roomList[name].count += 1;
        };

        // Допоміжна функція обробки одного товару
        const processItemForBom = (item: Item | Product, roomName: string) => {
            if (item.bomComponents) {
                item.bomComponents.forEach(comp => {
                    addToBom(comp.name, comp.price, comp.sku, roomName);
                });
            } else {
                addToBom(item.name, item.price, item.sku, roomName);
            }
        };

        // 1. Розподіляємо товари по кімнатах
        const itemsWithRooms = items.map(item => {
            if (item.assignedRoomId) {
                const room = rooms.find(r => r.id === item.assignedRoomId);
                return { ...item, roomName: room ? room.name : 'Нерозподілені' };
            }

            const bounds = getItemBounds(item);
            const room = rooms.find(r => {
                if (r.points && r.points.length > 2) {
                    return isPointInPolygon({ x: bounds.centerX, y: bounds.centerY }, r.points);
                }
                return r.width && r.height && r.x !== undefined && r.y !== undefined &&
                    bounds.centerX >= r.x && bounds.centerX <= r.x + r.width && 
                    bounds.centerY >= r.y && bounds.centerY <= r.y + r.height;
            });

            return { ...item, roomName: room ? room.name : 'Нерозподілені' };
        });

        // 2. Проходимо по всіх товарах і застосовуємо правила
        itemsWithRooms.forEach(item => {
            // Основний товар
            processItemForBom(item, item.roomName);

            // ПРАВИЛО: Gira E2 Flat (специфічні монтажні коробки)
            if (item.series === 'E2 Flat' && item.gangs) {
                const gangs = item.gangs as 1|2|3|4;
                
                // Завжди потрібна коробка для гіпсу (внутрішня частина)
                if (E2_FLAT_BOXES.hollow[gangs]) {
                    addToBom(E2_FLAT_BOXES.hollow[gangs].name, 0, E2_FLAT_BOXES.hollow[gangs].sku, item.roomName, true);
                }
                
                // Якщо стіна цегляна -> додаємо коробку для цегли
                if (item.wallType === 'brick' && E2_FLAT_BOXES.masonry[gangs]) {
                    addToBom(E2_FLAT_BOXES.masonry[gangs].name, 0, E2_FLAT_BOXES.masonry[gangs].sku, item.roomName, true);
                }
            }

            // ПРАВИЛО: Вміст рамок (механізми всередині)
            if (item.category === 'frame' && item.slots) {
                item.slots.forEach(mech => {
                    if (mech) processItemForBom(mech, item.roomName);
                });
            }
        });

        return { detectedFrames: groups, bom: bomData };
    }
};