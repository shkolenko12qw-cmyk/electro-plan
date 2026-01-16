import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Save, 
  FileText, 
  Grid, 
  Plus, 
  MousePointer2, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Magnet, 
  Ruler, 
  X, 
  Check, 
  Hand, 
  MousePointer, 
  RotateCw, 
  Layers, 
  Palette, 
  Download, 
  Printer, 
  Eye, 
  SquareDashedBottom, 
  Cloud, 
  CloudDownload 
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
// УВАГА: Розкоментуйте ці два рядки у вашому локальному проекті VS Code!
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase'; 

// --- MOCK DATA ---
const PRODUCTS = [
  { id: 'gira-e2-socket-black', sku: '4188005', name: 'Gira E2 Розетка (Чорний)', category: 'socket', brand: 'Gira', series: 'E2', color: '#1a1a1a', price: 450, width: 71, height: 71, shape: 'socket' },
  { id: 'gira-e2-switch-black', sku: '0106005', name: 'Gira E2 Вимикач (Чорний)', category: 'switch', brand: 'Gira', series: 'E2', color: '#1a1a1a', price: 520, width: 71, height: 71, shape: 'switch' },
  { id: 'gira-e2-socket-white', sku: '418804', name: 'Gira E2 Розетка (Білий)', category: 'socket', brand: 'Gira', series: 'E2', color: '#fdfdfd', price: 380, width: 71, height: 71, shape: 'socket' },
  { id: 'gira-e3-socket-sand', sku: '4188-E3-S', name: 'Gira E3 Розетка (Пісочний)', category: 'socket', brand: 'Gira', series: 'E3', color: '#d6cbb6', price: 550, width: 71, height: 71, shape: 'socket' },
  { id: 'led-profile-deep', sku: 'PROF-001', name: 'LED Профіль', category: 'light', brand: 'Lumina', series: 'Pro', color: '#cccccc', price: 350, width: 1000, height: 25, shape: 'linear' }
];

const AUTO_FRAMES = {
    'E2': { 1: { name: 'E2 Рамка 1-п', price: 120 }, 2: { name: 'E2 Рамка 2-п', price: 210 }, 3: { name: 'E2 Рамка 3-п', price: 350 }, 4: { name: 'E2 Рамка 4-п', price: 580 }, 5: { name: 'E2 Рамка 5-п', price: 820 } },
    'E3': { 1: { name: 'E3 Рамка 1-п', price: 250 }, 2: { name: 'E3 Рамка 2-п', price: 480 }, 3: { name: 'E3 Рамка 3-п', price: 690 }, 4: { name: 'E3 Рамка 4-п', price: 920 }, 5: { name: 'E3 Рамка 5-п', price: 1150 } },
    'Esprit': { 1: { name: 'Esprit Рамка 1-п', price: 950 }, 2: { name: 'Esprit Рамка 2-п', price: 1800 }, 3: { name: 'Esprit Рамка 3-п', price: 2600 }, 4: { name: 'Esprit Рамка 4-п', price: 3400 }, 5: { name: 'Esprit Рамка 5-п', price: 4200 } }
};

const ProductShape = ({ item, isSelected }) => {
  const strokeColor = isSelected ? '#3b82f6' : 'transparent';
  const isRound = item.series === 'E3';
  
  if (item.shape === 'socket') {
    return (
      <g>
        {isSelected && (
          <rect x={-2} y={-2} width={item.width + 4} height={item.height + 4} fill="none" stroke={strokeColor} strokeWidth={2} vectorEffect="non-scaling-stroke" rx={isRound ? 8 : 4} />
        )}
        <rect width={item.width} height={item.height} fill={item.color} rx={isRound ? 6 : 2} />
        <circle cx={item.width/2} cy={item.height/2} r={24} fill="rgba(0,0,0,0.1)" />
        <circle cx={item.width/2 - 12} cy={item.height/2} r={4} fill="#222" />
        <circle cx={item.width/2 + 12} cy={item.height/2} r={4} fill="#222" />
      </g>
    );
  }
  
  if (item.shape === 'switch') {
    return (
      <g>
         {isSelected && (
           <rect x={-2} y={-2} width={item.width + 4} height={item.height + 4} fill="none" stroke={strokeColor} strokeWidth={2} vectorEffect="non-scaling-stroke" rx={isRound ? 8 : 4} />
         )}
        <rect width={item.width} height={item.height} fill={item.color} rx={isRound ? 6 : 2} />
        <rect x={6} y={6} width={item.width-12} height={item.height-12} fill="rgba(255,255,255,0.05)" stroke="rgba(0,0,0,0.2)" strokeWidth={1} rx={isRound ? 4 : 1}/>
      </g>
    );
  }
  
  return <rect width={50} height={50} fill="red" />;
};

const App = () => {
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]); 
  const [selectedId, setSelectedId] = useState(null); 
  const [selectedType, setSelectedType] = useState(null); 
  const [planImage, setPlanImage] = useState(null);
  const [projectName, setProjectName] = useState('MyProject');
  
  const [scale, setScale] = useState(0.2); 
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const [activeTool, setActiveTool] = useState('select'); 
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const [draggedProductFromMenu, setDraggedProductFromMenu] = useState(null);
  const [internalDragItem, setInternalDragItem] = useState(null);
  const [snapLines, setSnapLines] = useState([]);
  
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [roomStartPos, setRoomStartPos] = useState(null);
  const [currentDrawingRoom, setCurrentDrawingRoom] = useState(null);

  const [detectedFrames, setDetectedFrames] = useState([]); 
  const [bom, setBom] = useState({ items: {}, total: 0, byRoom: {} }); 
  
  const [calibrationStep, setCalibrationStep] = useState(0); 
  const [calibPointA, setCalibPointA] = useState(null);
  const [showCalibModal, setShowCalibModal] = useState(false);
  const [calibInputMm, setCalibInputMm] = useState(1000);
  const [calibPixelDist, setCalibPixelDist] = useState(0);
  const [planScale, setPlanScale] = useState(1);
  const [tempMousePos, setTempMousePos] = useState(null); 

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const SNAP_THRESHOLD = 20; 
  const FRAME_PITCH = 71; 

  const screenToWorld = (screenX, screenY) => {
      const svgRect = svgRef.current.getBoundingClientRect();
      return { 
          x: (screenX - svgRect.left - pan.x) / scale, 
          y: (screenY - svgRect.top - pan.y) / scale 
      };
  };

  const getItemBounds = (item) => {
      const w = item.width || 71;
      const h = item.height || 71;
      const rot = item.rotation || 0;
      const cx = item.x + w/2;
      const cy = item.y + h/2;
      if (Math.abs(rot % 180) === 90) return { left: cx - h/2, right: cx + h/2, top: cy - w/2, bottom: cy + w/2, centerX: cx, centerY: cy, width: h, height: w, rotation: rot };
      return { left: item.x, right: item.x + w, top: item.y, bottom: item.y + h, centerX: cx, centerY: cy, width: w, height: h, rotation: rot };
  };

  // --- FIREBASE LOGIC (АКТИВОВАНО ДЛЯ ЛОКАЛЬНОГО ВИКОРИСТАННЯ) ---
  const saveProject = async () => {
    if (!projectName) return alert("Введіть назву проекту!");
    setIsLoading(true);
    
    // --- LOCAL VS CODE BLOCK ---
    // РОЗКОМЕНТУЙТЕ ЦЕЙ БЛОК У VS CODE
    
    try {
        await setDoc(doc(db, "projects", projectName), {
            items,
            rooms,
            planImage,
            planScale,
            updatedAt: new Date()
        });
        alert(`Проект "${projectName}" успішно збережено в хмару!`);
    } catch (e) {
        console.error("Error saving document: ", e);
        alert("Помилка збереження! Перевірте правильність файлу firebase.js.");
    }
    
    // --- PREVIEW ONLY BLOCK ---
    alert(`[РЕЖИМ ПЕРЕГЛЯДУ] Проект "${projectName}" готовий до збереження.\n\nУ VS Code розкоментуйте код Firebase у файлі src/App.jsx, щоб це запрацювало по-справжньому.`);
    
    setIsLoading(false);
  };

  const loadProject = async () => {
      const nameToLoad = prompt("Введіть назву проекту для завантаження:", projectName);
      if (!nameToLoad) return;
      setIsLoading(true);

      // --- LOCAL VS CODE BLOCK ---
      // РОЗКОМЕНТУЙТЕ ЦЕЙ БЛОК У VS CODE
      try {
          const docRef = doc(db, "projects", nameToLoad);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              setItems(data.items || []);
              setRooms(data.rooms || []);
              setPlanImage(data.planImage || null);
              setPlanScale(data.planScale || 1);
              setProjectName(nameToLoad);
              alert("Проект завантажено!");
          } else {
              alert("Проект не знайдено!");
          }
      } catch (e) {
          console.error("Error loading document: ", e);
          alert("Помилка завантаження! Перевірте з'єднання з базою.");
      }

      
      // --- PREVIEW ONLY BLOCK ---
      alert(`[РЕЖИМ ПЕРЕГЛЯДУ] Спроба завантажити "${nameToLoad}".\n\nУ VS Code розкоментуйте код Firebase у файлі src/App.jsx.`);

      setIsLoading(false);
  };

  useEffect(() => {
    const mechanizms = items.filter(i => i.category === 'socket' || i.category === 'switch');
    const visited = new Set();
    const groups = [];

    mechanizms.forEach(item => {
        if (visited.has(item.uniqueId)) return;
        const group = [item];
        visited.add(item.uniqueId);
        const queue = [item];
        while(queue.length > 0) {
            const current = queue.shift();
            const currBounds = getItemBounds(current);
            mechanizms.forEach(candidate => {
                if (visited.has(candidate.uniqueId)) return;
                if (candidate.series !== current.series) return;
                if ((candidate.rotation || 0) !== (current.rotation || 0)) return;
                const candBounds = getItemBounds(candidate);
                const rot = (current.rotation || 0) % 180;
                let isAdjacent = false;
                const distTolerance = 5; 
                if (rot === 0) {
                    const xDist = Math.abs(currBounds.centerX - candBounds.centerX);
                    const yDist = Math.abs(currBounds.centerY - candBounds.centerY);
                    if (Math.abs(xDist - FRAME_PITCH) < distTolerance && yDist < distTolerance) isAdjacent = true;
                } else {
                    const xDist = Math.abs(currBounds.centerX - candBounds.centerX);
                    const yDist = Math.abs(currBounds.centerY - candBounds.centerY);
                    if (Math.abs(yDist - FRAME_PITCH) < distTolerance && xDist < distTolerance) isAdjacent = true;
                }
                if (isAdjacent) { 
                    visited.add(candidate.uniqueId); 
                    group.push(candidate); 
                    queue.push(candidate); 
                }
            });
        }
        groups.push(group);
    });
    setDetectedFrames(groups);

    const itemsWithRooms = items.map(item => {
        const bounds = getItemBounds(item);
        const room = rooms.find(r => 
            bounds.centerX >= r.x && 
            bounds.centerX <= r.x + r.width && 
            bounds.centerY >= r.y && 
            bounds.centerY <= r.y + r.height
        );
        return { 
            ...item, 
            roomId: room ? room.id : 'unassigned', 
            roomName: room ? room.name : 'Нерозподілені' 
        };
    });

    const bomData = { items: {}, total: 0, byRoom: {} };
    
    const addToBom = (name, price, sku, roomName, isAuto = false) => {
        bomData.total += price;
        if (!bomData.byRoom[roomName]) bomData.byRoom[roomName] = {};
        const roomList = bomData.byRoom[roomName];
        if (!roomList[name]) roomList[name] = { count: 0, price, sku, isAuto };
        roomList[name].count += 1;
    };

    itemsWithRooms.forEach(item => addToBom(item.name, item.price, item.sku, item.roomName));
    
    groups.forEach(group => {
        const count = Math.min(group.length, 5);
        if(count < 1) return;
        const series = group[0].series || 'E2';
        const framesDB = AUTO_FRAMES[series] || AUTO_FRAMES['E2'];
        const frameData = framesDB[count];
        const firstItem = itemsWithRooms.find(i => i.uniqueId === group[0].uniqueId);
        const roomName = firstItem ? firstItem.roomName : 'Нерозподілені';
        
        if (frameData) addToBom(frameData.name, frameData.price, '-', roomName, true);
    });
    setBom(bomData);
  }, [items, rooms]);

  const handleDelete = () => { 
      if (selectedType === 'item') setItems(items.filter(i => i.uniqueId !== selectedId)); 
      else if (selectedType === 'room') setRooms(rooms.filter(r => r.id !== selectedId)); 
      setSelectedId(null); 
      setSelectedType(null); 
  };
  
  const handleRotate = () => { 
      if (selectedType === 'item') {
          setItems(prev => prev.map(item => item.uniqueId === selectedId ? { ...item, rotation: (item.rotation || 0) + 90 } : item)); 
      }
  };
  
  const handleMouseDown = (e) => {
      if (isPreviewMode) return;
      if (activeTool === 'room' && e.button === 0) { 
          const pos = screenToWorld(e.clientX, e.clientY); 
          setIsDrawingRoom(true); 
          setRoomStartPos(pos); 
          setCurrentDrawingRoom({ x: pos.x, y: pos.y, width: 0, height: 0 }); 
          return; 
      }
      if (activeTool === 'ruler' && e.button === 0) {
          if (calibrationStep === 0) { setCalibrationStep(1); setCalibPointA(null); }
          else if (calibrationStep === 1) { const pos = screenToWorld(e.clientX, e.clientY); setCalibPointA(pos); setCalibrationStep(2); }
          else if (calibrationStep === 2) { setShowCalibModal(true); }
          return;
      }
      if (activeTool === 'hand' || e.button === 1 || e.altKey) { 
          setIsPanning(true); 
          setLastMousePos({ x: e.clientX, y: e.clientY }); 
          return; 
      }
      if (e.target === svgRef.current) { setSelectedId(null); setSelectedType(null); }
  };

  const handleMouseMove = (e) => {
      if (isPanning) { 
          const dx = e.clientX - lastMousePos.x; 
          const dy = e.clientY - lastMousePos.y; 
          setPan(p => ({ x: p.x + dx, y: p.y + dy })); 
          setLastMousePos({ x: e.clientX, y: e.clientY }); 
          return; 
      }
      if (isDrawingRoom && roomStartPos) { 
          const pos = screenToWorld(e.clientX, e.clientY); 
          const x = Math.min(pos.x, roomStartPos.x); 
          const y = Math.min(pos.y, roomStartPos.y); 
          setCurrentDrawingRoom({ x, y, width: Math.abs(pos.x - roomStartPos.x), height: Math.abs(pos.y - roomStartPos.y) }); 
          return; 
      }
      if (activeTool === 'ruler' && calibrationStep === 2) { setTempMousePos(screenToWorld(e.clientX, e.clientY)); }
      
      if (internalDragItem) {
          const worldPos = screenToWorld(e.clientX, e.clientY);
          let newX = worldPos.x - internalDragItem.offsetX;
          let newY = worldPos.y - internalDragItem.offsetY;
          let centerX = newX + internalDragItem.originalW / 2;
          let centerY = newY + internalDragItem.originalH / 2;
          let lines = [];
          const effectiveThreshold = SNAP_THRESHOLD / scale; 
          
          items.forEach(other => {
              if (other.uniqueId === internalDragItem.id) return;
              const otherBounds = getItemBounds(other);
              if (Math.abs(centerX - otherBounds.centerX) < effectiveThreshold) { 
                  centerX = otherBounds.centerX; 
                  lines.push({ x1: otherBounds.centerX, y1: centerY-200, x2: otherBounds.centerX, y2: centerY+200 }); 
              }
              if (Math.abs(centerY - otherBounds.centerY) < effectiveThreshold) { 
                  centerY = otherBounds.centerY; 
                  lines.push({ x1: centerX-200, y1: otherBounds.centerY, x2: centerX+200, y2: otherBounds.centerY }); 
              }
              const xDist = centerX - otherBounds.centerX;
              if (Math.abs(Math.abs(xDist) - FRAME_PITCH) < effectiveThreshold && Math.abs(centerY - otherBounds.centerY) < effectiveThreshold) { 
                  centerX = otherBounds.centerX + (Math.sign(xDist) * FRAME_PITCH); 
                  centerY = otherBounds.centerY; 
              }
          });
          setSnapLines(lines);
          setItems(prev => prev.map(i => i.uniqueId === internalDragItem.id ? { ...i, x: centerX - internalDragItem.originalW/2, y: centerY - internalDragItem.originalH/2 } : i));
      }
  };

  const handleMouseUp = (e) => {
      setIsPanning(false); 
      setInternalDragItem(null); 
      setSnapLines([]);
      
      if (isDrawingRoom && currentDrawingRoom) {
          if (currentDrawingRoom.width > 50 && currentDrawingRoom.height > 50) {
              const name = prompt("Введіть назву кімнати:", "Нова кімната");
              if (name) setRooms([...rooms, { ...currentDrawingRoom, id: Date.now().toString(), name }]);
          }
          setIsDrawingRoom(false); 
          setCurrentDrawingRoom(null); 
          setRoomStartPos(null); 
          setActiveTool('select'); 
      }
  };

  const startItemDrag = (e, item) => { 
      if (activeTool !== 'select' || e.button !== 0) return; 
      e.stopPropagation(); 
      const worldPos = screenToWorld(e.clientX, e.clientY); 
      setInternalDragItem({ id: item.uniqueId, offsetX: worldPos.x - item.x, offsetY: worldPos.y - item.y, originalW: item.width, originalH: item.height }); 
      setSelectedId(item.uniqueId); 
      setSelectedType('item'); 
  };
  
  const handleDropOnCanvas = (e) => { 
      e.preventDefault(); 
      if (!draggedProductFromMenu) return; 
      const worldPos = screenToWorld(e.clientX, e.clientY); 
      setItems([...items, { ...draggedProductFromMenu, uniqueId: Date.now().toString(), rotation: 0, x: worldPos.x - (draggedProductFromMenu.width / 2), y: worldPos.y - (draggedProductFromMenu.height / 2) }]); 
      setDraggedProductFromMenu(null); 
  };
  
  const handleExportCSV = () => { 
      let csv = "data:text/csv;charset=utf-8,\uFEFFНазва,Кількість,Ціна,Сума\n"; 
      Object.entries(bom.items).forEach(([k,v]) => csv+=`"${k}",${v.count},${v.price},${v.count*v.price}\n`); 
      const link = document.createElement("a"); 
      link.href = encodeURI(csv); 
      link.download = "bom.csv"; 
      link.click(); 
  };
  
  const confirmCalibration = () => { 
      const realMm = parseFloat(calibInputMm); 
      if (!isNaN(realMm) && realMm > 0) { 
          const dx = tempMousePos.x - calibPointA.x; 
          const dy = tempMousePos.y - calibPointA.y; 
          const dist = Math.sqrt(dx*dx + dy*dy); 
          setPlanScale(prev => prev * (realMm / dist)); 
      } 
      setShowCalibModal(false); 
      setCalibrationStep(0); 
      setCalibPointA(null); 
      setActiveTool('select'); 
  };

  return (
    <div className={`flex h-screen flex-col bg-gray-100 font-sans text-gray-800 overflow-hidden ${isPreviewMode ? 'print-preview-mode' : ''} print:block print:h-auto print:overflow-visible`} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <style>{`@media print { @page { size: auto; margin: 5mm; } html, body, #root { height: auto !important; overflow: visible !important; } .hide-on-print { display: none !important; } } .print-preview-mode .screen-only { display: none !important; } .print-preview-mode .print-content-wrapper { background: white; margin: 20px auto; max-width: 210mm; box-shadow: 0 0 20px rgba(0,0,0,0.1); min-height: 297mm; padding: 10mm; }`}</style>
      <header className="bg-white border-b h-14 flex items-center justify-between px-6 shadow-sm z-10 select-none screen-only">
        <div className="flex items-center gap-2"> 
            <div className="bg-blue-600 text-white p-1.5 rounded"> <Grid size={20} /> </div> 
            <span className="font-bold text-lg">ElectroPlan Pro</span> 
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button onClick={() => setActiveTool('select')} className={`p-2 rounded ${activeTool === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><MousePointer size={18}/></button>
            <button onClick={() => setActiveTool('hand')} className={`p-2 rounded ${activeTool === 'hand' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Hand size={18}/></button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button onClick={() => setActiveTool('room')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${activeTool === 'room' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200'}`}> <SquareDashedBottom size={18} /> Кімната </button>
            <button onClick={() => setActiveTool('ruler')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${activeTool === 'ruler' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200'}`}> <Ruler size={16} /> </button>
        </div>
        <div className="flex gap-3 items-center">
             <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-32 outline-none" />
             <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files[0]; if(file) { const r = new FileReader(); r.onload = (ev) => { setPlanImage(ev.target.result); setPan({x:0,y:0}); setScale(0.2); setPlanScale(1); }; r.readAsDataURL(file); } }} className="hidden" />
            
            <button onClick={saveProject} disabled={isLoading} className="p-2 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 flex items-center gap-1" title="Зберегти в хмару"> {isLoading ? "..." : <Cloud size={18} />} </button>
            <button onClick={loadProject} disabled={isLoading} className="p-2 hover:bg-green-100 text-green-600 rounded border border-green-200 flex items-center gap-1" title="Завантажити з хмари"> {isLoading ? "..." : <CloudDownload size={18} />} </button>
            
            <button onClick={handleExportCSV} className="p-2 hover:bg-gray-100 rounded" title="Завантажити CSV"> <Download size={18} /> </button>
            <button onClick={() => setIsPreviewMode(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm shadow"> <Eye size={16} /> Перегляд / PDF </button>
        </div>
      </header>

      {isPreviewMode && ( <div className="fixed top-0 w-full h-14 bg-gray-800 text-white z-50 flex items-center justify-between px-6 shadow screen-only"> <span className="font-bold">Перегляд Друку</span> <div className="flex gap-4"> <button onClick={() => setTimeout(() => window.print(), 100)} className="bg-blue-600 px-4 py-1 rounded flex gap-2 items-center"><Printer size={16}/> Друк</button> <button onClick={() => setIsPreviewMode(false)} className="bg-gray-600 px-4 py-1 rounded">Закрити</button> </div> </div> )}

      <div className={`flex flex-1 overflow-hidden relative ${isPreviewMode ? 'print-content-wrapper overflow-visible h-auto block' : ''} print:block print:overflow-visible print:h-auto`}>
        <div className={`w-80 bg-white border-r flex flex-col shadow-lg z-10 select-none screen-only ${isPreviewMode ? 'hidden' : ''}`}>
           <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-gray-700">Каталог</h2></div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {PRODUCTS.map(p => ( <div key={p.id} draggable onDragStart={(e) => { if(activeTool!=='select') setActiveTool('select'); setDraggedProductFromMenu(p); }} className="flex items-center gap-3 p-2 border rounded hover:shadow cursor-grab bg-white"> <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">{p.series}</div> <div className="text-sm"> <div className="font-medium">{p.name}</div> <div className="text-xs text-gray-500">{p.price} ₴</div> </div> </div> ))}
           </div>
           <div className="h-1/3 border-t bg-gray-50 flex flex-col">
               <div className="p-3 border-b text-sm font-bold flex justify-between"><span>Всього</span><span className="text-blue-600">{bom.total} ₴</span></div>
               <div className="flex-1 overflow-y-auto p-3 text-xs"> {Object.keys(bom.byRoom).map(room => ( <div key={room} className="mb-3"> <div className="font-bold text-gray-700 border-b mb-1 pb-1">{room}</div> {Object.entries(bom.byRoom[room]).map(([name, d]) => ( <div key={name} className="flex justify-between py-0.5"><span>{name}</span><span className="font-mono">{d.count}</span></div> ))} </div> ))} </div>
           </div>
        </div>

        <div className={`flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center ${isPreviewMode ? 'bg-white block h-auto p-0 m-0' : ''} print:block print:bg-white print:w-full print:h-auto print:overflow-visible print:static`}>
            {!isPreviewMode && ( <div className="absolute top-4 left-4 bg-white p-1.5 rounded shadow flex flex-col gap-2 z-20 screen-only"> <button onClick={handleDelete} disabled={!selectedId} className={`p-2 rounded ${!selectedId ? 'text-gray-300' : 'text-red-600 hover:bg-red-50'}`}><Trash2 size={20}/></button> <button onClick={handleRotate} disabled={!selectedId || selectedType === 'room'} className={`p-2 rounded ${!selectedId ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}><RotateCw size={20}/></button> <div className="h-px bg-gray-200 my-1"></div> <button onClick={() => setScale(s => s * 1.2)} className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={20}/></button> <button onClick={() => setScale(s => s / 1.2)} className="p-2 hover:bg-gray-100 rounded"><ZoomOut size={20}/></button> </div> )}
            <div className={`hidden mb-6 border-b pb-4 ${isPreviewMode ? 'block' : ''} print:block`}> <h1 className="text-3xl font-bold">{projectName}</h1> </div>
            {showCalibModal && ( <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center screen-only"> <div className="bg-white rounded p-6"> <h3>Введіть реальний розмір (мм)</h3> <input type="number" value={calibInputMm} onChange={e=>setCalibInputMm(e.target.value)} className="border p-2 w-full my-4"/> <button onClick={confirmCalibration} className="bg-blue-600 text-white px-4 py-2 rounded">ОК</button> </div> </div> )}

            <div className={`w-full h-full relative overflow-hidden ${isPreviewMode ? 'h-[500px] border border-gray-300 mb-8' : ''} print:h-[500px] print:w-full print:border print:border-gray-300 print:mb-8`} style={{ cursor: activeTool==='hand' || isPanning ? 'grabbing' : activeTool==='room' ? 'crosshair' : 'default' }} onMouseDown={handleMouseDown} onContextMenu={e => e.preventDefault()} onWheel={(e) => { if(e.ctrlKey){e.preventDefault(); setScale(Math.max(0.01, scale - e.deltaY*0.001))} }} onDrop={handleDropOnCanvas} onDragOver={e => e.preventDefault()}>
                <svg ref={svgRef} width="100%" height="100%" className="block">
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                        <defs><pattern id="grid" width="1000" height="1000" patternUnits="userSpaceOnUse"><path d="M 1000 0 L 0 0 0 1000" fill="none" stroke="#ddd" strokeWidth="2"/></pattern></defs>
                        <rect x={-50000} y={-50000} width={100000} height={100000} fill={planImage ? 'none' : 'white'} pointerEvents="none" />
                        {!planImage && <rect x={-50000} y={-50000} width={100000} height={100000} fill="url(#grid)" pointerEvents="none" />}
                        {planImage ? (<g transform={`scale(${planScale})`}><image href={planImage} x={0} y={0} style={{ opacity: 0.9 }} pointerEvents="none" /></g>) : (<g opacity="0.5"><path d="M 0 0 L 5000 0 L 5000 3500 L 0 3500 L 0 0" stroke="#333" strokeWidth="10" fill="white" /><text x="100" y="200" fontSize="100" fill="#999" fontFamily="Arial">Demo Plan (5x3.5m)</text></g>)}
                        {rooms.map(room => ( <g key={room.id} onClick={(e) => { if(activeTool==='select'){ e.stopPropagation(); setSelectedId(room.id); setSelectedType('room'); } }}> <rect x={room.x} y={room.y} width={room.width} height={room.height} fill={selectedId === room.id ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.05)"} stroke="#2563eb" strokeWidth={4/scale} strokeDasharray={`${20/scale} ${10/scale}`} /> <text x={room.x + 10} y={room.y + 40/scale} fontSize={40/scale} fill="#2563eb" fontWeight="bold" pointerEvents="none">{room.name}</text> </g> ))}
                        {currentDrawingRoom && ( <rect x={currentDrawingRoom.x} y={currentDrawingRoom.y} width={currentDrawingRoom.width} height={currentDrawingRoom.height} fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth={2/scale} /> )}
                        {items.map(item => ( <g key={item.uniqueId} transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation || 0}, ${item.width/2}, ${item.height/2})`} onMouseDown={e => startItemDrag(e, item)}> <ProductShape item={item} isSelected={selectedId === item.uniqueId} /> </g> ))}
                        {detectedFrames.map((group, i) => { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; const series = group[0].series || 'E2'; const color = group[0].color || '#1a1a1a'; group.forEach(item => { const b = getItemBounds(item); minX=Math.min(minX, b.left); minY=Math.min(minY, b.top); maxX=Math.max(maxX, b.right); maxY=Math.max(maxY, b.bottom); }); const pad = (80-71)/2; const extra = series === 'Esprit' ? 7.5 : 0; return ( <g key={`f${i}`} pointerEvents="none"> <rect x={minX-pad-extra} y={minY-pad-extra} width={maxX-minX+pad*2+extra*2} height={maxY-minY+pad*2+extra*2} fill="none" stroke={color} strokeWidth={series==='Esprit'?8:4} rx={series==='E3'?10:2} /> </g> ); })}
                        {activeTool === 'ruler' && calibrationStep > 0 && !isPreviewMode && calibPointA && ( <g> <circle cx={calibPointA.x} cy={calibPointA.y} r={5/scale} fill="blue"/> {tempMousePos && <line x1={calibPointA.x} y1={calibPointA.y} x2={tempMousePos.x} y2={tempMousePos.y} stroke="blue" strokeWidth={2/scale} />} </g> )}
                        {!isPreviewMode && snapLines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="red" strokeWidth={2/scale} strokeDasharray={`${10/scale} ${10/scale}`} pointerEvents="none"/>)}
                    </g>
                </svg>
            </div>

            <div className={`hidden p-8 bg-white w-full ${isPreviewMode ? 'block' : ''} print:block`}>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Детальна Специфікація</h2>
                {Object.keys(bom.byRoom).map(roomName => ( <div key={roomName} className="mb-8 break-inside-avoid"> <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide bg-gray-100 p-2 rounded">{roomName}</h3> <table className="w-full text-sm border-collapse"> <thead><tr className="border-b border-gray-300"><th className="text-left py-2">Назва</th><th className="text-right py-2">К-сть</th><th className="text-right py-2">Сума</th></tr></thead> <tbody> {Object.values(bom.byRoom[roomName]).map((d, idx) => ( <tr key={idx} className="border-b border-gray-100"> <td className="py-2">{d.isAuto && <span className="text-blue-600 text-xs mr-1">[АВТО]</span>}{Object.keys(bom.byRoom[roomName]).find(key => bom.byRoom[roomName][key] === d)}</td> <td className="py-2 text-right font-bold">{d.count}</td> <td className="py-2 text-right">{d.count * d.price}</td> </tr> ))} </tbody> </table> </div> ))}
                <div className="text-right text-2xl font-bold mt-8 border-t pt-4">Разом: {bom.total} грн</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;