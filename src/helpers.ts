export const getRoomCenter = (room: any) => {
    if (room.points && room.points.length > 0) {
        const sum = room.points.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / room.points.length, y: sum.y / room.points.length };
    }
    return { 
        x: (room.x || 0) + (room.width || 0) / 2, 
        y: (room.y || 0) + (room.height || 0) / 2 
    };
};

export const getItemBounds = (item: any) => {
    const w = item.width || 71;
    const h = item.height || 71;
    const rot = item.rotation || 0;
    if (typeof item.x !== 'number' || typeof item.y !== 'number') 
        return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0, width: w, height: h, rotation: rot };
    const cx = item.x + w/2;
    const cy = item.y + h/2;
    if (Math.abs(rot % 180) === 90) 
        return { left: cx - h/2, right: cx + h/2, top: cy - w/2, bottom: cy + w/2, centerX: cx, centerY: cy, width: h, height: w, rotation: rot };
    return { left: item.x, right: item.x + w, top: item.y, bottom: item.y + h, centerX: cx, centerY: cy, width: w, height: h, rotation: rot };
};

export const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], {type:mime});
};

export const isPointInPolygon = (point: { x: number; y: number }, vs: { x: number; y: number }[]) => {
    const x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
};