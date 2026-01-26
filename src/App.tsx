import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  CloudDownload,
  Lock,
  Unlock,
  List,
  Map,
  Undo,
  Redo,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  BrickWall
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { supabase } from './supabaseClient';
import { INITIAL_PRODUCTS } from './products';
import { getRoomCenter, getItemBounds, dataURLtoBlob, isPointInPolygon } from './helpers';
import { ValidationService } from './ValidationService';
import { BomService } from './BomService';
import { ProductShape } from './components/ProductShape';
import { Product, Item, Room } from './types';

const App = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [items, setItems] = useState<Item[]>([]);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [selectedType, setSelectedType] = useState<'item' | 'room' | null>(null); 
  const [planImage, setPlanImage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('MyProject');
  
  const [scale, setScale] = useState(0.2); 
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const lastMiddleClickTime = useRef(0);
  
  const [activeTool, setActiveTool] = useState('select'); 
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'plan'
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const [draggedProductFromMenu, setDraggedProductFromMenu] = useState<Product | null>(null);
  const [internalDragItem, setInternalDragItem] = useState(null);
  const [rotationDragItem, setRotationDragItem] = useState(null);
  const [snapLines, setSnapLines] = useState<any[]>([]);
  
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [roomStartPos, setRoomStartPos] = useState<{x: number, y: number} | null>(null);
  const [currentDrawingRoom, setCurrentDrawingRoom] = useState(null);
  const [roomPoints, setRoomPoints] = useState<{ x: number; y: number }[]>([]);

  const [calibrationStep, setCalibrationStep] = useState(0); 
  const [calibPointA, setCalibPointA] = useState<{x: number, y: number} | null>(null);
  const [showCalibModal, setShowCalibModal] = useState(false);
  const [calibInputMm, setCalibInputMm] = useState(1000);
  const [calibPixelDist, setCalibPixelDist] = useState(0);
  const [planScale, setPlanScale] = useState(1);
  const [tempMousePos, setTempMousePos] = useState<{x: number, y: number} | null>(null); 
  const [slotModal, setSlotModal] = useState({ isOpen: false, itemId: null, slotIndex: null });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [activeListRoomId, setActiveListRoomId] = useState<string | null>(null);
  const [newRoomNameInput, setNewRoomNameInput] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [worldSize, setWorldSize] = useState({ width: 5000, height: 3500 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [replaceModal, setReplaceModal] = useState<{ isOpen: boolean, itemId: string | null }>({ isOpen: false, itemId: null });

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const catalogInputRef = useRef(null);
  const SNAP_THRESHOLD = 20; 
  const FRAME_PITCH = 71; 

  // --- CATALOG HELPERS ---
  const addToRecent = (product) => {
      setRecentProductIds(prev => {
          const newRecent = [product.id, ...prev.filter(id => id !== product.id)];
          return newRecent.slice(0, 5);
      });
  };

  const groupedProducts = useMemo(() => {
      const groups = {};
      
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.includes(searchQuery)
      );

      filtered.forEach(p => {
          const brand = p.brand || 'Інше';
          if (!groups[brand]) groups[brand] = { frames: {}, mechanisms: {} };
          
          if (p.category === 'frame') {
              const series = p.series || 'Інше';
              if (!groups[brand].frames[series]) groups[brand].frames[series] = [];
              groups[brand].frames[series].push(p);
          } else {
              // Mechanisms
              let func = 'Інше';
              if (p.category === 'socket') func = 'Розетки';
              else if (p.category === 'switch') func = 'Вимикачі';
              
              if (!groups[brand].mechanisms[func]) groups[brand].mechanisms[func] = [];
              groups[brand].mechanisms[func].push(p);
          }
      });
      return groups;
  }, [products]);

  const recentProducts = useMemo(() => {
      return recentProductIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  }, [recentProductIds, products]);


  const screenToWorld = (screenX, screenY) => {
      const svgRect = svgRef.current.getBoundingClientRect();
      return { 
          x: (screenX - svgRect.left - pan.x) / scale, 
          y: (screenY - svgRect.top - pan.y) / scale 
      };
  };

  // Helper: Конвертація Base64 в Blob для завантаження в Supabase Storage
  const dataURLtoBlob = (dataurl) => {
      const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
  };

  // --- UNDO/REDO LOGIC ---
  const addToHistory = (newItems, newRooms, newPlanImage, newPlanScale) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push({ 
          items: JSON.parse(JSON.stringify(newItems)), 
          rooms: JSON.parse(JSON.stringify(newRooms)),
          planImage: newPlanImage,
          planScale: newPlanScale
      });
      // Обмежуємо історію останніми 50 діями
      if (newHistory.length > 50) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (historyStep > 0) {
          const prev = history[historyStep - 1];
          setItems(prev.items);
          setRooms(prev.rooms);
          setPlanImage(prev.planImage);
          setPlanScale(prev.planScale);
          setHistoryStep(historyStep - 1);
      }
  };

  const handleRedo = () => {
      if (historyStep < history.length - 1) {
          const next = history[historyStep + 1];
          setItems(next.items);
          setRooms(next.rooms);
          setPlanImage(next.planImage);
          setPlanScale(next.planScale);
          setHistoryStep(historyStep + 1);
      }
  };

  // Ініціалізація історії
  useEffect(() => {
      if (history.length === 0 && items.length === 0 && rooms.length === 0) {
          addToHistory([], [], null, 1);
      }
  }, []);

  // --- АВТОМАТИЧНЕ ЗАВАНТАЖЕННЯ ЦІН З КОРЕНЯ (public/prices.xlsx) ---
  useEffect(() => {
      const loadPricesFromRoot = async () => {
          try {
              // Шукаємо файл prices.xlsx у папці public
              const response = await fetch('/prices.xlsx');
              if (!response.ok) return;
              
              const buffer = await response.arrayBuffer();
              const excelModule = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
              const ExcelJS = excelModule.default || excelModule;
              const workbook = new ExcelJS.Workbook();
              await workbook.xlsx.load(buffer);
              const worksheet = workbook.getWorksheet(1);
              
              const priceUpdates = {};
              worksheet.eachRow((row) => {
                  const sku = row.getCell(1).text?.toString().trim();
                  const price = parseFloat(row.getCell(2).text?.toString().replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
                  if (sku && !isNaN(price)) priceUpdates[sku] = price;
              });

              if (Object.keys(priceUpdates).length > 0) {
                  setProducts(prev => prev.map(p => priceUpdates[p.sku] !== undefined ? { ...p, price: priceUpdates[p.sku] } : p));
                  setProducts(prev => prev.map(p => {
                      let newP = { ...p };
                      let componentsChanged = false;
                      
                      if (priceUpdates[p.sku] !== undefined) newP.price = priceUpdates[p.sku];

                      if (newP.bomComponents) {
                          newP.bomComponents = newP.bomComponents.map(comp => {
                              if (priceUpdates[comp.sku] !== undefined) {
                                  componentsChanged = true;
                                  return { ...comp, price: priceUpdates[comp.sku] };
                              }
                              return comp;
                          });
                          if (componentsChanged && priceUpdates[p.sku] === undefined) newP.price = newP.bomComponents.reduce((sum, c) => sum + c.price, 0);
                      }
                      return newP;
                  }));
                  
                  setItems(prev => prev.map(item => {
                      let newItem = { ...item };
                      if (priceUpdates[item.sku] !== undefined) {
                          newItem.price = priceUpdates[item.sku];
                      }
                      if (newItem.bomComponents) {
                          newItem.bomComponents = newItem.bomComponents.map(comp => {
                              if (priceUpdates[comp.sku] !== undefined) {
                                  return { ...comp, price: priceUpdates[comp.sku] };
                              }
                              return comp;
                          });
                      }
                      return newItem;
                  }));
              }
          } catch (e) { console.error("Помилка автозавантаження цін:", e); }
      };
      loadPricesFromRoot();
  }, []);

  // Гарячі клавіші Ctrl+Z / Ctrl+Y
  useEffect(() => {
      const handleKeyDown = (e) => {
          // Undo/Redo
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              handleRedo();
          }
          // Видалення вибраного
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && activeTool === 'select') {
              if (e.target.tagName !== 'INPUT') handleDelete();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyStep]);

  // --- FIREBASE LOGIC (ЗАКОМЕНТОВАНО ДЛЯ PREVIEW) ---
  const saveProject = async () => {
    if (!projectName) return alert("Введіть назву проекту!");
    if (!supabase) return alert("Supabase не підключено!");
    setIsLoading(true);
    
    try {
        let imageUrl = planImage;
        
        // Якщо це base64 (нове зображення), завантажуємо в Supabase Storage
        if (planImage && planImage.startsWith('data:')) {
            const blob = dataURLtoBlob(planImage);
            const fileName = `${projectName}_${Date.now()}.png`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('plans')
                .upload(fileName, blob, { upsert: true });
                
            if (uploadError) throw uploadError;
            
            // Отримуємо публічне посилання
            const { data: { publicUrl } } = supabase.storage
                .from('plans')
                .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
        }

        const projectData = {
            items,
            rooms,
            planImage: imageUrl,
            planScale,
            updatedAt: new Date().toISOString()
        };

        // Зберігаємо дані в таблицю 'projects'
        const { error } = await supabase
            .from('projects')
            .upsert({ id: projectName, content: projectData });

        if (error) throw error;

        alert(`Проект "${projectName}" успішно збережено в Supabase!`);
    } catch (e) {
        console.error("Error saving document: ", e);
        alert("Помилка збереження: " + e.message);
    }
    
    setIsLoading(false);
  };

  const loadProject = async () => {
      const nameToLoad = prompt("Введіть назву проекту для завантаження:", projectName);
      if (!nameToLoad) return;
      if (!supabase) return alert("Supabase не підключено!");
      setIsLoading(true);

      try {
          const { data, error } = await supabase
              .from('projects')
              .select('content')
              .eq('id', nameToLoad)
              .single();

          if (error) throw error;

          if (data) {
              const loaded = data.content;
              // Оновлюємо ціни завантажених товарів згідно з поточним каталогом
              setItems(syncItemsWithCatalog(loaded.items || []));
              setRooms(loaded.rooms || []);
              setPlanImage(loaded.planImage || null);
              setPlanScale(loaded.planScale || 1);
              setProjectName(nameToLoad);
              addToHistory(loaded.items || [], loaded.rooms || [], loaded.planImage || null, loaded.planScale || 1);
              alert("Проект завантажено!");
          } else {
              alert("Проект не знайдено!");
          }
      } catch (e) {
          console.error("Error loading document: ", e);
          alert("Помилка завантаження: " + e.message);
      }

      setIsLoading(false);
  };

  const { detectedFrames, bom } = useMemo(() => {
    return BomService.calculate(items, rooms, products);
  }, [items, rooms, products]); 

  const handleDelete = () => { 
      if (selectedType === 'item') {
          const pinned = items.filter(i => selectedIds.includes(i.uniqueId) && i.isPinned);
          if (pinned.length > 0) return alert("Деякі елементи закріплено! Спочатку відкріпіть їх.");
          const newItems = items.filter(i => !selectedIds.includes(i.uniqueId));
          setItems(newItems); 
          addToHistory(newItems, rooms, planImage, planScale);
      }
      else if (selectedType === 'room') {
          const newRooms = rooms.filter(r => !selectedIds.includes(r.id));
          setRooms(newRooms);
          if (activeListRoomId && selectedIds.includes(activeListRoomId)) setActiveListRoomId(null);
          addToHistory(items, newRooms, planImage, planScale);
      }
      setSelectedIds([]); 
      setSelectedType(null); 
  };
  
  const handleRotate = () => { 
      if (selectedType === 'item') {
          const newItems = items.map(i => (selectedIds.includes(i.uniqueId) && !i.isPinned) ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i);
          setItems(newItems); 
          addToHistory(newItems, rooms, planImage, planScale);
      }
  };

  const updateWallType = (type: 'brick' | 'gypsum') => {
      if (selectedType === 'item') {
          const newItems = items.map(i => selectedIds.includes(i.uniqueId) ? { ...i, wallType: type } : i);
          setItems(newItems);
          addToHistory(newItems, rooms, planImage, planScale);
      }
  };

  // Функція для оновлення цін у списку товарів відповідно до актуального каталогу
  const syncItemsWithCatalog = (itemsToSync: Item[]) => {
      return itemsToSync.map(item => {
          const catalogProduct = products.find(p => p.sku === item.sku);
          if (catalogProduct) {
              return {
                  ...item,
                  price: catalogProduct.price,
                  bomComponents: catalogProduct.bomComponents ? JSON.parse(JSON.stringify(catalogProduct.bomComponents)) : undefined
              };
          }
          return item;
      });
  };

  const handleReplaceApply = (newProduct: Product, scope: 'single' | 'room') => {
      const targetItem = items.find(i => i.uniqueId === replaceModal.itemId);
      if (!targetItem) return;

      let idsToUpdate = [targetItem.uniqueId];

      if (scope === 'room') {
          // Helper to find room for an item
          const getRoomId = (item: Item) => {
              if (item.assignedRoomId) return item.assignedRoomId;
              const b = getItemBounds(item);
              const foundRoom = rooms.find(r => {
                  if (r.points && r.points.length > 2) return isPointInPolygon({ x: b.centerX, y: b.centerY }, r.points);
                  return r.width && r.height && r.x !== undefined && r.y !== undefined && b.centerX >= r.x && b.centerX <= r.x + r.width && b.centerY >= r.y && b.centerY <= r.y + r.height;
              });
              return foundRoom ? foundRoom.id : null;
          };

          const targetRoomId = getRoomId(targetItem);

          if (targetRoomId) {
              const siblings = items.filter(i => 
                  i.uniqueId !== targetItem.uniqueId &&
                  i.category === targetItem.category &&
                  i.series === targetItem.series &&
                  i.shape === targetItem.shape &&
                  (i.category !== 'frame' || i.gangs === targetItem.gangs) &&
                  getRoomId(i) === targetRoomId
              );
              idsToUpdate = [...idsToUpdate, ...siblings.map(s => s.uniqueId)];
          }
      }

      const newItems = items.map(i => {
          if (idsToUpdate.includes(i.uniqueId)) {
              return {
                  ...i,
                  ...newProduct,
                  uniqueId: i.uniqueId,
                  x: i.x, y: i.y, rotation: i.rotation, isPinned: i.isPinned, assignedRoomId: i.assignedRoomId,
                  slots: i.slots, wallType: i.wallType
              };
          }
          return i;
      });

      setItems(newItems);
      addToHistory(newItems, rooms, planImage, planScale);
      setReplaceModal({ isOpen: false, itemId: null });
  };

  // Оновлюємо розміри контейнера при зміні вікна
  useEffect(() => {
      const updateSize = () => {
          if (canvasRef.current) {
              const { width, height } = canvasRef.current.getBoundingClientRect();
              setContainerSize({ width, height });
          }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
  }, [viewMode]);

  const handleTogglePin = () => {
      if (selectedType === 'item') {
          const newItems = items.map(item => selectedIds.includes(item.uniqueId) ? { ...item, isPinned: !item.isPinned } : item);
          setItems(newItems);
          addToHistory(newItems, rooms, planImage, planScale);
      }
  };

  const fitToScreen = () => {
      const worldW = worldSize.width * planScale; 
      const worldH = worldSize.height * planScale;
      const { width, height } = containerSize;
      
      // Розраховуємо масштаб, щоб вмістити все
      const scaleX = width / worldW;
      const scaleY = height / worldH;
      const newScale = Math.min(scaleX, scaleY) * 0.95; // 95% заповнення
      
      // Центруємо
      const newPanX = (width - worldW * newScale) / 2;
      const newPanY = (height - worldH * newScale) / 2;
      
      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
  };

  const handleMinimapClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Переводимо координати кліку на міні-карті в координати світу (враховуючи planScale)
      const worldX = (clickX / rect.width) * worldSize.width * planScale;
      const worldY = (clickY / rect.height) * worldSize.height * planScale;
      
      // Центруємо камеру на цій точці
      const newPanX = (containerSize.width / 2) - (worldX * scale);
      const newPanY = (containerSize.height / 2) - (worldY * scale);
      
      setPan({ x: newPanX, y: newPanY });
  };
  
  const handleMouseDown = (e) => {
      if (isPreviewMode) return;
      if (activeTool === 'room' && e.button === 0) { 
          const pos = screenToWorld(e.clientX, e.clientY);
          
          // Перевірка на замикання полігону (клік по першій точці)
          if (roomPoints.length > 2) {
              const first = roomPoints[0];
              const dist = Math.sqrt(Math.pow(pos.x - first.x, 2) + Math.pow(pos.y - first.y, 2));
              if (dist < 20 / scale) {
                  const name = prompt("Введіть назву кімнати:", "Нова кімната");
                  if (name) {
                      const newRooms = [...rooms, { id: Date.now().toString(), name, points: [...roomPoints] }];
                      setRooms(newRooms);
                      addToHistory(items, newRooms, planImage, planScale);
                  }
                  setRoomPoints([]);
                  setIsDrawingRoom(false);
                  return;
              }
          }
          setRoomPoints([...roomPoints, pos]);
          setIsDrawingRoom(true);
          return; 
      }
      if (activeTool === 'ruler' && e.button === 0) {
          const pos = screenToWorld(e.clientX, e.clientY);
          if (calibrationStep === 0) { 
              setCalibPointA(pos); 
              setCalibrationStep(1); 
          } else if (calibrationStep === 1) { 
              setTempMousePos(pos);
              setShowCalibModal(true); 
          }
          return;
      }
      if (activeTool === 'hand' || e.button === 1 || e.altKey) { 
          // Перевірка на подвійний клік колесом (Fit to Screen)
          if (e.button === 1) {
              const now = Date.now();
              if (now - lastMiddleClickTime.current < 300) {
                  fitToScreen();
                  return;
              }
              lastMiddleClickTime.current = now;
          }
          setIsPanning(true); 
          setLastMousePos({ x: e.clientX, y: e.clientY }); 
          return; 
      }
      if (activeTool === 'select' && e.target === svgRef.current) {
          if (!e.ctrlKey) {
              setSelectedIds([]);
              setSelectedType(null);
          }
          const pos = screenToWorld(e.clientX, e.clientY);
          setIsSelecting(true);
          setSelectionBox({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, width: 0, height: 0 });
      }
  };

  const handleMouseMove = (e) => {
      if (isPanning) { 
          const dx = e.clientX - lastMousePos.x; 
          const dy = e.clientY - lastMousePos.y; 
          setPan(p => ({ x: p.x + dx, y: p.y + dy })); 
          setLastMousePos({ x: e.clientX, y: e.clientY }); 
          return; 
      }
      if (isDrawingRoom) { setTempMousePos(screenToWorld(e.clientX, e.clientY)); }
      if (activeTool === 'ruler' && calibrationStep === 1 && !showCalibModal) { setTempMousePos(screenToWorld(e.clientX, e.clientY)); }
      
      if (isSelecting && selectionBox) {
          const pos = screenToWorld(e.clientX, e.clientY);
          const x = Math.min(pos.x, selectionBox.startX);
          const y = Math.min(pos.y, selectionBox.startY);
          const width = Math.abs(pos.x - selectionBox.startX);
          const height = Math.abs(pos.y - selectionBox.startY);
          setSelectionBox({ ...selectionBox, x, y, width, height });
      }

      if (rotationDragItem) {
          const worldPos = screenToWorld(e.clientX, e.clientY);
          const dx = worldPos.x - rotationDragItem.centerX;
          const dy = worldPos.y - rotationDragItem.centerY;
          
          // Розраховуємо кут в градусах
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          
          // Примагнічування до 15 градусів при натиснутому Shift
          if (e.shiftKey) {
              angle = Math.round(angle / 15) * 15;
          }
          
          setItems(prev => prev.map(i => i.uniqueId === rotationDragItem.id ? { ...i, rotation: angle } : i));
          return;
      }

      if (internalDragItem) {
          const worldPos = screenToWorld(e.clientX, e.clientY);
          const dx = worldPos.x - internalDragItem.startWorldX;
          const dy = worldPos.y - internalDragItem.startWorldY;
          
          setItems(prev => prev.map(i => {
              if (selectedIds.includes(i.uniqueId)) {
                  const initial = internalDragItem.initialPositions[i.uniqueId];
                  if (initial) {
                      return { ...i, x: initial.x + dx, y: initial.y + dy };
                  }
              }
              return i;
          }));
      }
  };

  const handleMouseUp = (e) => {
      // Якщо відбулося переміщення або обертання, зберігаємо в історію
      if (internalDragItem || rotationDragItem) {
          addToHistory(items, rooms, planImage, planScale);
      }

      setIsPanning(false); 
      setInternalDragItem(null); 
      setRotationDragItem(null);
      setSnapLines([]);
      
      if (isSelecting) {
          if (selectionBox && selectionBox.width > 0) {
              const selected = items.filter(i => {
                  const b = getItemBounds(i);
                  return b.right >= selectionBox.x && b.left <= selectionBox.x + selectionBox.width &&
                         b.bottom >= selectionBox.y && b.top <= selectionBox.y + selectionBox.height;
              }).map(i => i.uniqueId);
              
              if (e.ctrlKey) {
                  setSelectedIds(prev => [...new Set([...prev, ...selected])]);
              } else {
                  setSelectedIds(selected);
              }
              if (selected.length > 0) setSelectedType('item');
          }
          setIsSelecting(false);
          setSelectionBox(null);
      }
      
  };

  const startItemDrag = (e, item) => { 
      if (e.button !== 0) return; 
      e.stopPropagation(); 
      
      let newSelectedIds = selectedIds;
      if (e.ctrlKey) {
          newSelectedIds = selectedIds.includes(item.uniqueId) 
              ? selectedIds.filter(id => id !== item.uniqueId)
              : [...selectedIds, item.uniqueId];
          setSelectedIds(newSelectedIds);
          setSelectedType('item');
          return;
      } else if (!selectedIds.includes(item.uniqueId)) {
          newSelectedIds = [item.uniqueId];
          setSelectedIds(newSelectedIds);
      }
      setSelectedType('item'); 

      // Дозволяємо перетягування тільки в режимі Select і якщо елемент не закріплений
      if (activeTool === 'select' && !item.isPinned) {
          const worldPos = screenToWorld(e.clientX, e.clientY); 
          const initialPositions = {};
          items.forEach(i => {
              if (newSelectedIds.includes(i.uniqueId)) initialPositions[i.uniqueId] = { x: i.x, y: i.y };
          });
          setInternalDragItem({ 
              id: item.uniqueId, 
              startWorldX: worldPos.x, 
              startWorldY: worldPos.y,
              initialPositions
          }); 
      }
  };

  const startRotationDrag = (e, item) => {
      e.stopPropagation();
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      setRotationDragItem({
          id: item.uniqueId,
          centerX,
          centerY
      });
  };
  
  const handleDropOnCanvas = (e) => { 
      e.preventDefault(); 
      if (!draggedProductFromMenu) return; 
      const worldPos = screenToWorld(e.clientX, e.clientY); 
      
      const newItem = { 
          ...draggedProductFromMenu, 
          uniqueId: Date.now().toString(), 
          rotation: 0, 
          x: worldPos.x - (draggedProductFromMenu.width / 2), 
          y: worldPos.y - (draggedProductFromMenu.height / 2),
          slots: draggedProductFromMenu.category === 'frame' ? Array(draggedProductFromMenu.gangs).fill(null) : undefined,
          wallType: draggedProductFromMenu.series === 'E2 Flat' ? 'brick' : undefined
      };

      const newItems = [...items, newItem];
      setItems(newItems); 
      addToHistory(newItems, rooms, planImage, planScale);
      setDraggedProductFromMenu(null); 
      addToRecent(draggedProductFromMenu);
  };

  const handleCatalogItemClick = (product) => {
      if (viewMode === 'list') {
          if (!activeListRoomId) return alert("Спочатку оберіть або створіть кімнату зі списку зліва!");
          const newItem = {
              ...product,
              uniqueId: Date.now().toString(),
              assignedRoomId: activeListRoomId,
              rotation: 0,
              slots: product.category === 'frame' ? Array(product.gangs).fill(null) : undefined,
              wallType: product.series === 'E2 Flat' ? 'brick' : undefined
          };
          const newItems = [...items, newItem];
          setItems(newItems);
          addToHistory(newItems, rooms, planImage, planScale);
          addToRecent(product);
      }
  };

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.type === 'application/pdf') {
          try {
              const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm');
              pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
              
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjs.getDocument(arrayBuffer).promise;
              const page = await pdf.getPage(1);
              const viewport = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              
              setWorldSize({ width: viewport.width, height: viewport.height });
              const newImage = canvas.toDataURL();
              setPlanImage(newImage);
              setPan({x:0,y:0}); setScale(0.2); setPlanScale(1);
              addToHistory(items, rooms, newImage, 1); // Тут items не змінюються, тому синхронізація не потрібна
          } catch (err) {
              alert("Помилка завантаження PDF. Перевірте інтернет або спробуйте зображення.");
          }
      } else {
          const r = new FileReader(); 
          r.onload = (ev) => { 
              const img = new Image();
              img.onload = () => {
                  setWorldSize({ width: img.width, height: img.height });
                  const newImage = ev.target.result;
                  setPlanImage(newImage); 
                  setPan({x:0,y:0}); setScale(0.2); setPlanScale(1); 
                  // Якщо це завантаження JSON проекту (якщо ви додасте таку можливість), тут теж варто використати syncItemsWithCatalog
                  // Але для зображень items залишаються поточними
                  addToHistory(items, rooms, newImage, 1); 
              };
              img.src = ev.target.result;
          }; 
          r.readAsDataURL(file);
      }
  };
  
  const handleExportCSV = () => { 
      let csv = "data:text/csv;charset=utf-8,\uFEFFНазва,Кількість,Ціна,Сума\n"; 
      Object.entries(bom.items).forEach(([k,v]) => csv+=`"${k}",${v.count},${v.price},${v.count*v.price}\n`); 
      const link = document.createElement("a"); 
      link.href = encodeURI(csv); 
      link.download = "bom.csv"; 
      link.click(); 
  };

  const handleImportCatalog = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
          const excelModule = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
          const ExcelJS = excelModule.default || excelModule;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(await file.arrayBuffer());
          const worksheet = workbook.getWorksheet(1);

          const priceUpdates = {};
          
          worksheet.eachRow((row, rowNumber) => {
              // Очікуємо: A=Артикул, B=Ціна
              const sku = row.getCell(1).text ? row.getCell(1).text.toString().trim() : '';
              let priceStr = row.getCell(2).text ? row.getCell(2).text.toString().replace(',', '.') : '0';
              priceStr = priceStr.replace(/[^0-9.-]/g, '');
              const price = parseFloat(priceStr);
              
              if (sku && !isNaN(price)) {
                  priceUpdates[sku] = price;
              }
          });

          // 1. Оновлюємо каталог
          setProducts(prev => prev.map(p => {
              let newP = { ...p };
              let componentsChanged = false;
              
              if (priceUpdates[p.sku] !== undefined) newP.price = priceUpdates[p.sku];

              if (newP.bomComponents) {
                  newP.bomComponents = newP.bomComponents.map(comp => {
                      if (priceUpdates[comp.sku] !== undefined) {
                          componentsChanged = true;
                          return { ...comp, price: priceUpdates[comp.sku] };
                      }
                      return comp;
                  });
                  if (componentsChanged && priceUpdates[p.sku] === undefined) newP.price = newP.bomComponents.reduce((sum, c) => sum + c.price, 0);
              }
              return newP;
          }));

          // 2. Оновлюємо товари на плані
          setItems(prev => prev.map(item => {
              let newItem = { ...item };
              if (priceUpdates[item.sku] !== undefined) {
                  newItem.price = priceUpdates[item.sku];
              }
              if (newItem.bomComponents) {
                  newItem.bomComponents = newItem.bomComponents.map(comp => {
                      if (priceUpdates[comp.sku] !== undefined) {
                          return { ...comp, price: priceUpdates[comp.sku] };
                      }
                      return comp;
                  });
              }
              return newItem;
          }));

          alert(`Ціни оновлено для ${Object.keys(priceUpdates).length} артикулів.`);
      } catch (error) {
          console.error('Price update error:', error);
          alert('Помилка оновлення цін. Перевірте формат файлу (xlsx).');
      }
  };

  const handleExportExcel = async () => {
      try {
          const excelModule = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
          const ExcelJS = excelModule.default || excelModule;
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Специфікація');

          // Налаштування колонок
          worksheet.columns = [
              { header: '№', key: 'id', width: 5 },
              { header: 'Артикул', key: 'sku', width: 15 },
              { header: 'Назва', key: 'name', width: 40 },
              { header: 'Кількість', key: 'quantity', width: 10 },
              { header: 'Ціна', key: 'price', width: 12 },
              { header: 'Сума', key: 'sum', width: 12 },
          ];

          // Стилізація шапки
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

          let globalIdx = 1;
          let totalSum = 0;

          // Проходимо по кімнатах
          for (const [roomName, items] of Object.entries(bom.byRoom)) {
              // Рядок кімнати
              const roomRow = worksheet.addRow([roomName]);
              roomRow.font = { bold: true, size: 12 };
              roomRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
              worksheet.mergeCells(`A${roomRow.number}:F${roomRow.number}`);

              // Підготовка та сортування товарів (Механізми -> Рамки)
              const roomItemsArr = Object.entries(items).map(([name, data]) => {
                  let isFrame = name.toLowerCase().includes('рамка');
                  const product = products.find(p => p.sku === data.sku);
                  if (product && product.category === 'frame') isFrame = true;
                  return { name, ...data, isFrame };
              });

              roomItemsArr.sort((a, b) => (a.isFrame === b.isFrame) ? 0 : a.isFrame ? 1 : -1);

              roomItemsArr.forEach(item => {
                  const row = worksheet.addRow({
                      id: globalIdx++,
                      sku: item.sku,
                      name: item.name,
                      quantity: item.count,
                      price: item.price,
                      sum: item.count * item.price
                  });
                  row.getCell('price').numFmt = '#,##0.00';
                  row.getCell('sum').numFmt = '#,##0.00';
                  totalSum += item.count * item.price;
              });
          }

          // Підсумок
          worksheet.addRow([]);
          const totalRow = worksheet.addRow(['', '', '', '', 'Разом:', totalSum]);
          totalRow.font = { bold: true };
          totalRow.getCell('sum').numFmt = '#,##0.00';

          // Збереження
          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${projectName}_specification.xlsx`;
          link.click();
      } catch (error) {
          console.error('Excel export error:', error);
          alert('Помилка експорту в Excel. Переконайтеся, що встановлено пакет exceljs (npm install exceljs).');
      }
  };
  
  const confirmCalibration = () => { 
      const realMm = parseFloat(calibInputMm); 
      if (!isNaN(realMm) && realMm > 0 && tempMousePos && calibPointA) { 
          // Розраховуємо дистанцію в "чистих" пікселях зображення (без врахування planScale)
          const dx = (tempMousePos.x - calibPointA.x) / planScale; 
          const dy = (tempMousePos.y - calibPointA.y) / planScale; 
          const pixelDist = Math.sqrt(dx*dx + dy*dy); 
          
          if (pixelDist === 0) return;

          const newScale = realMm / pixelDist; // Абсолютний масштаб: скільки мм в одному пікселі
          const ratio = newScale / planScale;  // Коефіцієнт зміни для існуючих об'єктів

          // Масштабуємо позиції всіх товарів на плані
          const updatedItems = items.map(item => ({
              ...item,
              x: typeof item.x === 'number' ? item.x * ratio : item.x,
              y: typeof item.y === 'number' ? item.y * ratio : item.y
          }));

          // Масштабуємо координати та розміри всіх кімнат
          const updatedRooms = rooms.map(room => ({
              ...room,
              x: typeof room.x === 'number' ? room.x * ratio : room.x,
              y: typeof room.y === 'number' ? room.y * ratio : room.y,
              width: typeof room.width === 'number' ? room.width * ratio : room.width,
              height: typeof room.height === 'number' ? room.height * ratio : room.height,
              points: room.points ? room.points.map(p => ({ x: p.x * ratio, y: p.y * ratio })) : room.points
          }));

          setItems(updatedItems);
          setRooms(updatedRooms);
          setPlanScale(newScale); 
          addToHistory(updatedItems, updatedRooms, planImage, newScale);
      } 
      setShowCalibModal(false); 
      setCalibrationStep(0); 
      setCalibPointA(null); 
      setActiveTool('select'); 
  };

  const handleSlotClick = (itemId, slotIndex) => {
      setSlotModal({ isOpen: true, itemId, slotIndex });
  };

  const selectMechanismForSlot = (mech) => {
      const frame = items.find(i => i.uniqueId === slotModal.itemId);
      if (mech && !ValidationService.isCompatible(frame, mech)) {
          alert(`Увага! Механізм ${mech.name} може бути несумісним із рамкою ${frame.series}`);
          // Можна або перервати, або просто попередити
      }

      const newItems = items.map(item => {
          if (item.uniqueId !== slotModal.itemId) return item;
          const newSlots = [...item.slots];
          newSlots[slotModal.slotIndex] = mech;
          return { ...item, slots: newSlots };
      });
      setItems(newItems);
      addToHistory(newItems, rooms, planImage, planScale);
      setSlotModal({ isOpen: false, itemId: null, slotIndex: null });
  };

  // Зберігаємо актуальні значення scale та pan у ref для використання в event listener
  const transformRef = useRef({ scale, pan });
  useEffect(() => {
      transformRef.current = { scale, pan };
  }, [scale, pan]);

  // Додаємо обробник колеса миші з { passive: false } для блокування масштабування браузера
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e) => {
          // Блокуємо масштабування браузера при натисканні Ctrl
          if (e.ctrlKey) {
              e.preventDefault();
          }
          e.stopPropagation();

          const { scale: currentScale, pan: currentPan } = transformRef.current;
          
          // Логіка масштабування
          const zoomIntensity = 0.1;
          const delta = -Math.sign(e.deltaY); 
          const zoomFactor = Math.exp(delta * zoomIntensity);
          
          const newScale = currentScale * zoomFactor;
          
          // Обмеження масштабу
          if (newScale < 0.01 || newScale > 50) return;

          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          // Розрахунок нового зсуву (pan) для масштабування відносно курсору
          const newPanX = mouseX - (mouseX - currentPan.x) * (newScale / currentScale);
          const newPanY = mouseY - (mouseY - currentPan.y) * (newScale / currentScale);

          // Оновлюємо ref миттєво, щоб уникнути "смикання" при швидкому скролі
          transformRef.current = { scale: newScale, pan: { x: newPanX, y: newPanY } };

          setScale(newScale);
          setPan({ x: newPanX, y: newPanY });
      };

      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const renderCatalogItem = (p) => (
      <div key={p.id} draggable onDragStart={(e) => { if(activeTool!=='select') setActiveTool('select'); setDraggedProductFromMenu(p); }} onClick={() => handleCatalogItemClick(p)} className="flex items-center gap-3 p-2 border rounded hover:shadow cursor-grab bg-white active:bg-blue-50 mb-2">
          {p.category === 'frame' ? (
              <div className="w-8 h-8 rounded bg-gray-800 text-white flex items-center justify-center text-xs font-bold">{p.gangs}x</div>
          ) : (
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold" style={{backgroundColor: p.color, color: p.color === '#1a1a1a' ? 'white' : 'black'}}>{p.series ? p.series.substring(0,2) : 'M'}</div>
          )}
          <div className="text-sm">
              <div className="font-medium line-clamp-2">{p.name}</div>
              <div className="text-xs text-gray-500">{p.price} ₴</div>
          </div>
      </div>
  );

  return (
    <div className={`flex h-screen flex-col bg-gray-100 font-sans text-gray-800 overflow-hidden ${isPreviewMode ? 'print-preview-mode' : ''} print:block print:h-auto print:overflow-visible`} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <style>{`@media print { @page { size: auto; margin: 5mm; } html, body, #root { height: auto !important; overflow: visible !important; } .hide-on-print { display: none !important; } } .print-preview-mode .screen-only { display: none !important; } .print-preview-mode .print-content-wrapper { background: white; margin: 20px auto; max-width: 210mm; box-shadow: 0 0 20px rgba(0,0,0,0.1); min-height: 297mm; padding: 10mm; }`}</style>
      <header className="bg-white border-b h-14 flex items-center justify-between px-6 shadow-sm z-10 select-none screen-only">
        <div className="flex items-center gap-2"> 
            <div className="bg-blue-600 text-white p-1.5 rounded"> <Grid size={20} /> </div> 
            <span className="font-bold text-lg">ElectroPlan Pro</span> 
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 mx-4">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}> <List size={18} /> Списком </button>
            <button onClick={() => setViewMode('plan')} className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'plan' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}> <Map size={18} /> На плані </button>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 mx-2">
            <button onClick={handleUndo} disabled={historyStep <= 0} className={`p-2 rounded ${historyStep > 0 ? 'text-gray-700 hover:bg-white hover:shadow' : 'text-gray-300'}`} title="Скасувати (Ctrl+Z)"><Undo size={18}/></button>
            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className={`p-2 rounded ${historyStep < history.length - 1 ? 'text-gray-700 hover:bg-white hover:shadow' : 'text-gray-300'}`} title="Повернути (Ctrl+Y)"><Redo size={18}/></button>
        </div>

        {viewMode === 'plan' && (
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button onClick={() => setActiveTool('select')} className={`p-2 rounded ${activeTool === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Вибір"><MousePointer size={18}/></button>
                <button onClick={() => setActiveTool('hand')} className={`p-2 rounded ${activeTool === 'hand' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Переміщення"><Hand size={18}/></button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button onClick={() => setActiveTool('room')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${activeTool === 'room' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200'}`}> <SquareDashedBottom size={18} /> Кімната </button>
                <button onClick={() => setActiveTool('ruler')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${activeTool === 'ruler' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200'}`}> <Ruler size={16} /> </button>
            </div>
        )}

        <div className="flex gap-3 items-center">
             <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-32 outline-none" />
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
             <input type="file" ref={catalogInputRef} onChange={handleImportCatalog} accept=".xlsx" className="hidden" />
             <button onClick={() => catalogInputRef.current.click()} className="p-2 hover:bg-yellow-100 text-yellow-700 rounded border border-yellow-200" title="Оновити ціни (Excel)"> <List size={18} /> </button>
             <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-gray-100 rounded" title="Завантажити план"> <Upload size={18} /> </button>
            
            <button onClick={saveProject} disabled={isLoading} className="p-2 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 flex items-center gap-1" title="Зберегти в хмару"> {isLoading ? "..." : <Cloud size={18} />} </button>
            <button onClick={loadProject} disabled={isLoading} className="p-2 hover:bg-green-100 text-green-600 rounded border border-green-200 flex items-center gap-1" title="Завантажити з хмари"> {isLoading ? "..." : <CloudDownload size={18} />} </button>
            
            <button onClick={handleExportCSV} className="p-2 hover:bg-gray-100 rounded" title="Завантажити CSV"> <Download size={18} /> </button>
            <button onClick={handleExportExcel} className="p-2 hover:bg-green-100 text-green-700 rounded" title="Експорт в Excel"> <FileSpreadsheet size={18} /> </button>
            <button onClick={() => setIsPreviewMode(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm shadow"> <Eye size={16} /> Перегляд / PDF </button>
        </div>
      </header>

      {isPreviewMode && ( <div className="fixed top-0 w-full h-14 bg-gray-800 text-white z-50 flex items-center justify-between px-6 shadow screen-only"> <span className="font-bold">Перегляд Друку</span> <div className="flex gap-4"> <button onClick={() => setTimeout(() => window.print(), 100)} className="bg-blue-600 px-4 py-1 rounded flex gap-2 items-center"><Printer size={16}/> Друк</button> <button onClick={() => setIsPreviewMode(false)} className="bg-gray-600 px-4 py-1 rounded">Закрити</button> </div> </div> )}

      {slotModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center screen-only" onClick={() => setSlotModal({isOpen:false, itemId:null, slotIndex:null})}>
              <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-4">Оберіть механізм</h3>
                  <div className="space-y-2">
                      {products.filter(p => p.category === 'socket' || p.category === 'switch').map(p => (
                          <div key={p.id} onClick={() => selectMechanismForSlot(p)} className="flex items-center gap-3 p-2 border rounded hover:bg-blue-50 cursor-pointer">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">{p.series}</div>
                              <div><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.price} ₴</div></div>
                          </div>
                      ))}
                      <button onClick={() => selectMechanismForSlot(null)} className="w-full p-2 text-red-600 border border-red-200 rounded hover:bg-red-50 mt-2">Очистити слот</button>
                  </div>
              </div>
          </div>
      )}

      <div className={`flex flex-1 overflow-hidden relative ${isPreviewMode ? 'print-content-wrapper overflow-visible h-auto block' : ''} print:block print:overflow-visible print:h-auto`}>
        <div className={`w-80 bg-white border-r flex flex-col shadow-lg z-10 select-none screen-only ${isPreviewMode ? 'hidden' : ''}`}>
           <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-gray-700">Каталог</h2></div>
           
           {/* Пошук */}
           <div className="p-3 border-b">
               <div className="relative">
                   <input type="text" placeholder="Пошук за назвою або SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                   <MousePointer2 size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
               </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-3">
             
             {/* RECENTLY USED */}
             {recentProducts.length > 0 && (
                 <div className="mb-4">
                     <div className="text-xs text-gray-400 uppercase font-bold mb-2">Нещодавно використані</div>
                     {recentProducts.map(renderCatalogItem)}
                 </div>
             )}

             {/* GROUPED PRODUCTS */}
             {Object.entries(groupedProducts).map(([brand, data]) => (
                 <details key={brand} open className="group mb-2">
                     <summary className="font-bold text-gray-800 cursor-pointer list-none flex items-center gap-2 bg-gray-100 p-2 rounded hover:bg-gray-200">
                         <ChevronRight size={16} className="transition-transform group-open:rotate-90"/> {brand}
                     </summary>
                     <div className="pl-2 pt-2">
                         {/* FRAMES */}
                         {Object.keys(data.frames).length > 0 && (
                             <div className="mb-2">
                                 <div className="text-xs text-gray-500 font-bold uppercase mb-1 pl-2">Рамки</div>
                                 {Object.entries(data.frames).map(([series, items]) => (
                                     <details key={series} className="group/series ml-2 mb-1">
                                         <summary className="text-sm font-medium cursor-pointer list-none flex items-center gap-1 text-gray-700 hover:text-blue-600">
                                             <ChevronRight size={14} className="transition-transform group-open/series:rotate-90"/> {series}
                                         </summary>
                                         <div className="pl-2 pt-1">
                                             {items.sort((a,b) => a.gangs - b.gangs).map(renderCatalogItem)}
                                         </div>
                                     </details>
                                 ))}
                             </div>
                         )}
                         {/* MECHANISMS */}
                         {Object.keys(data.mechanisms).length > 0 && (
                             <div className="mb-2">
                                 <div className="text-xs text-gray-500 font-bold uppercase mb-1 pl-2">Механізми</div>
                                 {Object.entries(data.mechanisms).map(([func, items]) => (
                                     <div key={func} className="ml-2 mb-2">
                                         <div className="text-xs font-bold text-gray-600 mb-1 pl-4 border-l-2 border-gray-200">{func}</div>
                                         <div className="pl-2">
                                             {items.sort((a,b) => a.name.localeCompare(b.name)).map(renderCatalogItem)}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </details>
             ))}
           </div>
           <div className="h-1/3 border-t bg-gray-50 flex flex-col">
               <div className="p-3 border-b text-sm font-bold flex justify-between"><span>Всього</span><span className="text-blue-600">{bom.total} ₴</span></div>
               <div className="flex-1 overflow-y-auto p-3 text-xs"> {Object.keys(bom.byRoom).map(room => ( <div key={room} className="mb-3"> <div className="font-bold text-gray-700 border-b mb-1 pb-1">{room}</div> {Object.entries(bom.byRoom[room]).map(([name, d]) => ( <div key={name} className="flex justify-between py-0.5"><span>{name}</span><span className="font-mono">{d.count}</span></div> ))} </div> ))} </div>
           </div>
        </div>

        {/* LIST MODE VIEW */}
        {viewMode === 'list' && !isPreviewMode && (
            <div className="flex-1 bg-gray-50 flex overflow-hidden">
                {/* Room Manager Sidebar */}
                <div className="w-64 bg-white border-r flex flex-col">
                    <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">Кімнати</div>
                    <div className="p-2 border-b flex gap-2">
                        <input type="text" placeholder="Назва кімнати" value={newRoomNameInput} onChange={e => setNewRoomNameInput(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" onKeyDown={e => { if(e.key === 'Enter' && newRoomNameInput) { const newRooms = [...rooms, { id: Date.now().toString(), name: newRoomNameInput }]; setRooms(newRooms); addToHistory(items, newRooms, planImage, planScale); setNewRoomNameInput(''); } }} />
                        <button onClick={() => { if(newRoomNameInput) { const newRooms = [...rooms, { id: Date.now().toString(), name: newRoomNameInput }]; setRooms(newRooms); addToHistory(items, newRooms, planImage, planScale); setNewRoomNameInput(''); } }} className="bg-blue-600 text-white p-1 rounded"><Plus size={18}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {rooms.map(r => (
                            <div key={r.id} onClick={() => setActiveListRoomId(r.id)} className={`p-3 border-b cursor-pointer flex justify-between items-center hover:bg-gray-50 ${activeListRoomId === r.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}>
                                <span>{r.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити кімнату?')) { const newRooms = rooms.filter(rm => rm.id !== r.id); setRooms(newRooms); if(activeListRoomId===r.id) setActiveListRoomId(null); addToHistory(items, newRooms, planImage, planScale); } }} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        {rooms.length === 0 && <div className="p-4 text-gray-400 text-sm text-center">Створіть кімнату, щоб додати товари</div>}
                    </div>
                </div>

                {/* Items List for Active Room */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeListRoomId ? (
                        <div className="bg-white rounded shadow p-6 max-w-3xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 border-b pb-2">{rooms.find(r => r.id === activeListRoomId)?.name}</h2>
                            <div className="space-y-4">
                                {items.filter(i => i.assignedRoomId === activeListRoomId).length === 0 ? ( <div className="text-gray-400 text-center py-10">Список порожній. Оберіть товар з каталогу зліва, щоб додати.</div> ) : (
                                    items.filter(i => i.assignedRoomId === activeListRoomId).map((item, idx) => (
                                        <div key={item.uniqueId} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600">{idx + 1}</div>
                                                <div>
                                                    <div className="font-bold">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.sku} | {item.series}</div>
                                                    {item.slots && (
                                                        <div className="flex gap-1 mt-1">
                                                            {item.slots.map((slot, sIdx) => (
                                                                <div key={sIdx} onClick={() => handleSlotClick(item.uniqueId, sIdx)} className={`w-6 h-6 border rounded cursor-pointer flex items-center justify-center text-xs ${slot ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-dashed'}`} title={slot ? slot.name : "Пустий слот"}>
                                                                    {slot ? '✓' : '+'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="font-bold">{item.price} ₴</div>
                                                <button onClick={() => { const newItems = items.filter(i => i.uniqueId !== item.uniqueId); setItems(newItems); addToHistory(newItems, rooms, planImage, planScale); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-lg">Оберіть кімнату зі списку зліва</div>
                    )}
                </div>
            </div>
        )}

        {/* PLAN MODE VIEW */}
        <div className={`flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center ${viewMode === 'list' && !isPreviewMode ? 'hidden' : ''} ${isPreviewMode ? 'bg-white block h-auto p-0 m-0' : ''} print:block print:bg-white print:w-full print:h-auto print:overflow-visible print:static`}>
            {!isPreviewMode && ( 
                <div className="absolute top-4 left-4 bg-white p-1.5 rounded shadow flex flex-col gap-2 z-20 screen-only"> 
                    <button onClick={handleDelete} disabled={selectedIds.length === 0} className={`p-2 rounded ${selectedIds.length === 0 ? 'text-gray-300' : 'text-red-600 hover:bg-red-50'}`} title="Видалити"><Trash2 size={20}/></button> 
                    <button onClick={handleRotate} disabled={selectedIds.length === 0 || selectedType === 'room'} className={`p-2 rounded ${selectedIds.length === 0 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`} title="Обернути"><RotateCw size={20}/></button> 
                    <button onClick={() => selectedIds.length === 1 && setReplaceModal({ isOpen: true, itemId: selectedIds[0] })} disabled={selectedIds.length !== 1 || selectedType !== 'item'} className={`p-2 rounded ${selectedIds.length !== 1 ? 'text-gray-300' : 'text-purple-600 hover:bg-purple-50'}`} title="Замінити / Колір"><Palette size={20}/></button>
                    <button onClick={handleTogglePin} disabled={selectedIds.length === 0 || selectedType !== 'item'} className={`p-2 rounded ${selectedIds.length === 0 ? 'text-gray-300' : 'text-orange-600 hover:bg-orange-50'}`} title="Закріпити/Відкріпити"> {items.find(i => selectedIds.includes(i.uniqueId))?.isPinned ? <Lock size={20}/> : <Unlock size={20}/>} </button> 
                    
                    {selectedIds.length === 1 && items.find(i => i.uniqueId === selectedIds[0])?.series === 'E2 Flat' && (
                        <>
                            <div className="h-px bg-gray-200 my-1"></div>
                            <div className="flex flex-col gap-1 bg-gray-50 rounded p-1">
                                <div className="text-[10px] font-bold text-gray-500 text-center">Тип стіни</div>
                                <button onClick={() => updateWallType('brick')} className={`p-1.5 rounded text-xs flex items-center gap-1 ${items.find(i => i.uniqueId === selectedIds[0])?.wallType === 'brick' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`} title="Цегляна стіна"><BrickWall size={16} /> Цегла</button>
                                <button onClick={() => updateWallType('gypsum')} className={`p-1.5 rounded text-xs flex items-center gap-1 ${items.find(i => i.uniqueId === selectedIds[0])?.wallType === 'gypsum' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`} title="Гіпсова стіна"><Layers size={16} /> Гіпс</button>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-gray-200 my-1"></div> 
                    <button onClick={() => setScale(s => s * 1.2)} className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={20}/></button> 
                    <button onClick={() => setScale(s => s / 1.2)} className="p-2 hover:bg-gray-100 rounded"><ZoomOut size={20}/></button> 
                </div> 
            )}
            <div className={`hidden mb-6 border-b pb-4 ${isPreviewMode ? 'block' : ''} print:block`}> <h1 className="text-3xl font-bold">{projectName}</h1> </div>
            {showCalibModal && ( <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center screen-only"> <div className="bg-white rounded p-6"> <h3>Введіть реальний розмір (мм)</h3> <input type="number" value={calibInputMm} onChange={e=>setCalibInputMm(e.target.value)} className="border p-2 w-full my-4"/> <button onClick={confirmCalibration} className="bg-blue-600 text-white px-4 py-2 rounded">ОК</button> </div> </div> )}
            
            {replaceModal.isOpen && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center screen-only" onClick={() => setReplaceModal({ isOpen: false, itemId: null })}>
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Оберіть варіант для заміни</h3>
                        <div className="space-y-2">
                            {(() => {
                                const target = items.find(i => i.uniqueId === replaceModal.itemId);
                                if (!target) return null;
                                const variants = products.filter(p => p.category === target.category && p.series === target.series && p.shape === target.shape && (target.category !== 'frame' || p.gangs === target.gangs) && p.id !== target.id);
                                if (variants.length === 0) return <div className="text-gray-500">Немає доступних варіантів</div>;
                                return variants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-2 border rounded hover:bg-blue-50">
                                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded border" style={{backgroundColor: p.color}}></div><span className="text-sm font-medium">{p.name}</span></div>
                                        <div className="flex gap-1"><button onClick={() => handleReplaceApply(p, 'single')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Цей</button><button onClick={() => handleReplaceApply(p, 'room')} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded">Всі в кімнаті</button></div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <div ref={canvasRef} className={`w-full h-full relative overflow-hidden ${isPreviewMode ? 'h-[500px] border border-gray-300 mb-8' : ''} print:h-[500px] print:w-full print:border print:border-gray-300 print:mb-8`} style={{ cursor: activeTool==='hand' || isPanning ? 'grabbing' : activeTool==='room' ? 'crosshair' : 'default' }} onMouseDown={handleMouseDown} onContextMenu={e => e.preventDefault()} onDrop={handleDropOnCanvas} onDragOver={e => e.preventDefault()}>
                
                {/* MINIMAP */}
                {!isPreviewMode && showMinimap && (
                    <div className="absolute bottom-4 right-4 bg-white border-2 border-gray-300 shadow-lg z-30 overflow-hidden opacity-90 hover:opacity-100 transition-opacity" style={{ width: 200, height: 140 }}>
                        <button 
                            onClick={() => setShowMinimap(false)} 
                            className="absolute top-0 right-0 bg-white/80 hover:bg-gray-100 p-1 rounded-bl z-40 text-gray-600"
                            title="Приховати"
                        >
                            <X size={14} />
                        </button>
                        <svg width="100%" height="100%" viewBox={`0 0 ${worldSize.width} ${worldSize.height}`} preserveAspectRatio="none" onMouseDown={handleMinimapClick} className="cursor-crosshair bg-gray-50">
                            {/* Background Preview */}
                            {planImage ? (<image href={planImage} x={0} y={0} width={worldSize.width} height={worldSize.height} opacity={0.5} />) : (<path d="M 0 0 L 5000 0 L 5000 3500 L 0 3500 L 0 0" fill="white" stroke="#ddd" strokeWidth="50" />)}
                            
                            {/* Rooms Preview */}
                            {rooms.filter(r => r.width).map(r => ( <rect key={r.id} x={r.x} y={r.y} width={r.width} height={r.height} fill="rgba(37, 99, 235, 0.3)" stroke="none" /> ))}
                            
                            {/* Viewport Rectangle (Current View) */}
                            <rect 
                                x={(-pan.x / scale) / planScale} y={(-pan.y / scale) / planScale} 
                                width={(containerSize.width / scale) / planScale} height={(containerSize.height / scale) / planScale} 
                                fill="none" stroke="red" strokeWidth="2" vectorEffect="non-scaling-stroke" 
                            />
                        </svg>
                        {/* Scale Ruler (1000 units = 1m approx) */}
                        <div className="absolute bottom-1 left-2 pointer-events-none z-40">
                            <div className="border-b-2 border-gray-800 w-[40px] h-2 relative border-l border-r border-gray-800">
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-800 bg-white/50 px-0.5 rounded">1m</span>
                            </div>
                        </div>
                    </div>
                )}
                {!isPreviewMode && !showMinimap && (
                    <div className="absolute bottom-4 right-4 z-30">
                        <button 
                            onClick={() => setShowMinimap(true)}
                            className="bg-white p-2 rounded shadow border border-gray-300 hover:bg-gray-50 text-blue-600"
                            title="Показати міні-карту"
                        >
                            <Map size={24} />
                        </button>
                    </div>
                )}

                <svg ref={svgRef} width="100%" height="100%" className="block">
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                        <defs><pattern id="grid" width="1000" height="1000" patternUnits="userSpaceOnUse"><path d="M 1000 0 L 0 0 0 1000" fill="none" stroke="#ddd" strokeWidth="2"/></pattern></defs>
                        <rect x={-50000} y={-50000} width={100000} height={100000} fill={planImage ? 'none' : 'white'} pointerEvents="none" />
                        {!planImage && <rect x={-50000} y={-50000} width={100000} height={100000} fill="url(#grid)" pointerEvents="none" />}
                        {planImage ? (<g transform={`scale(${planScale})`}><image href={planImage} x={0} y={0} width={worldSize.width} height={worldSize.height} style={{ opacity: 0.9 }} pointerEvents="none" /></g>) : (<g opacity="0.5"><path d="M 0 0 L 5000 0 L 5000 3500 L 0 3500 L 0 0" stroke="#333" strokeWidth="10" fill="white" /><text x="100" y="200" fontSize="100" fill="#999" fontFamily="Arial">Demo Plan (5x3.5m)</text></g>)}
                        
                        {rooms.map(room => (
                            <g key={room.id} onClick={(e) => { if(activeTool==='select'){ e.stopPropagation(); setSelectedIds([room.id]); setSelectedType('room'); } }}>
                                {room.points ? (
                                    <polygon 
                                        points={room.points.map(p => `${p.x},${p.y}`).join(' ')}
                                        fill={selectedIds.includes(room.id) ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.05)"}
                                        stroke="#2563eb"
                                        strokeWidth={4/scale}
                                        strokeDasharray={`${20/scale} ${10/scale}`}
                                    />
                                ) : (
                                    <rect x={room.x} y={room.y} width={room.width} height={room.height} fill={selectedIds.includes(room.id) ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.05)"} stroke="#2563eb" strokeWidth={4/scale} strokeDasharray={`${20/scale} ${10/scale}`} />
                                )}
                                {(() => {
                                    const center = getRoomCenter(room);
                                    return (
                                        <text 
                                            x={center.x} 
                                            y={center.y} 
                                            fontSize={100 * planScale} 
                                            fill="#2563eb" 
                                            fontWeight="bold" 
                                            textAnchor="middle" 
                                            dominantBaseline="middle"
                                            pointerEvents="none"
                                        >
                                            {room.name}
                                        </text>
                                    );
                                })()}
                            </g>
                        ))}

                        {isDrawingRoom && roomPoints.length > 0 && (
                            <g pointerEvents="none">
                                <polyline 
                                    points={[...roomPoints, tempMousePos].filter(Boolean).map(p => `${p!.x},${p!.y}`).join(' ')}
                                    fill="rgba(37, 99, 235, 0.1)"
                                    stroke="#2563eb"
                                    strokeWidth={2/scale}
                                />
                                {roomPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5/scale} fill={i === 0 ? "red" : "#2563eb"} />)}
                            </g>
                        )}

                        {selectionBox && <rect x={selectionBox.x} y={selectionBox.y} width={selectionBox.width} height={selectionBox.height} fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth={1/scale} strokeDasharray="4 2" />}
                        {items.filter(i => typeof i.x === 'number').map(item => {
                            const isSelected = selectedIds.includes(item.uniqueId);
                            return (
                                <g key={item.uniqueId} transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation || 0}, ${item.width/2}, ${item.height/2})`} onMouseDown={e => startItemDrag(e, item)}>
                                    <ProductShape item={item} isSelected={isSelected} onSlotClick={(slotIdx) => handleSlotClick(item.uniqueId, slotIdx)} />
                                    {isSelected && !item.isPinned && (
                                        <g onMouseDown={(e) => startRotationDrag(e, item)} style={{ cursor: 'alias' }}>
                                            <line x1={item.width/2} y1={0} x2={item.width/2} y2={-30} stroke="#3b82f6" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="4 2" />
                                            <circle cx={item.width/2} cy={-30} r={10} fill="white" stroke="#3b82f6" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                                            <path d={`M ${item.width/2 - 4} ${-30} L ${item.width/2 + 4} ${-30} M ${item.width/2} ${-34} L ${item.width/2 + 4} ${-30} L ${item.width/2} ${-26}`} fill="none" stroke="#3b82f6" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                        {detectedFrames.map((group, i) => { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; const series = group[0].series || 'E2'; const color = group[0].color || '#1a1a1a'; group.forEach(item => { const b = getItemBounds(item); minX=Math.min(minX, b.left); minY=Math.min(minY, b.top); maxX=Math.max(maxX, b.right); maxY=Math.max(maxY, b.bottom); }); const pad = (80-71)/2; const extra = series === 'Esprit' ? 7.5 : 0; return ( <g key={`f${i}`} pointerEvents="none"> <rect x={minX-pad-extra} y={minY-pad-extra} width={maxX-minX+pad*2+extra*2} height={maxY-minY+pad*2+extra*2} fill="none" stroke={color} strokeWidth={series==='Esprit'?8:4} rx={series==='E3'?10:2} /> </g> ); })}
                        {activeTool === 'ruler' && calibrationStep > 0 && !isPreviewMode && calibPointA && ( <g> <circle cx={calibPointA.x} cy={calibPointA.y} r={5/scale} fill="blue"/> {tempMousePos && <line x1={calibPointA.x} y1={calibPointA.y} x2={tempMousePos.x} y2={tempMousePos.y} stroke="blue" strokeWidth={2/scale} />} </g> )}
                        {!isPreviewMode && snapLines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="red" strokeWidth={2/scale} strokeDasharray={`${10/scale} ${10/scale}`} pointerEvents="none"/>)}
                    </g>
                </svg>
            </div>

            <div className={`hidden p-8 bg-white w-full ${isPreviewMode ? 'block' : ''} print:block`}>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Детальна Специфікація</h2>
                {Object.entries(bom.byRoom).map(([roomName, roomItems]) => ( <div key={roomName} className="mb-8 break-inside-avoid"> <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide bg-gray-100 p-2 rounded">{roomName}</h3> <table className="w-full text-sm border-collapse"> <thead><tr className="border-b border-gray-300"><th className="text-left py-2">Назва</th><th className="text-right py-2">К-сть</th><th className="text-right py-2">Сума</th></tr></thead> <tbody> {Object.entries(roomItems).map(([name, d]) => ( <tr key={name} className="border-b border-gray-100"> <td className="py-2">{d.isAuto && <span className="text-blue-600 text-xs mr-1">[АВТО]</span>}{name}</td> <td className="py-2 text-right font-bold">{d.count}</td> <td className="py-2 text-right">{d.count * d.price}</td> </tr> ))} </tbody> </table> </div> ))}
                <div className="text-right text-2xl font-bold mt-8 border-t pt-4">Разом: {bom.total} грн</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;