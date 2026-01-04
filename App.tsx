
import React, { useState, useEffect, useMemo } from 'react';
import { 
  OrderStatus, 
  Location, 
  Order, 
  AppRole, 
  Message,
  UserProfile
} from './types';
import { TRINIDAD_COORDS, CATEGORIES } from './constants';
import MapDisplay from './components/MapDisplay';
import ChatBox from './components/ChatBox';
import CameraCapture from './components/CameraCapture';
import { 
  User, 
  Bike,
  XCircle,
  Bell,
  Navigation,
  CheckCircle,
  Phone,
  MapPin,
  Check,
  Search,
  ChevronRight,
  Home,
  FileText,
  MessageCircle,
  Heart,
  Loader2,
  LogOut,
  Send,
  DollarSign
} from 'lucide-react';

const App: React.FC = () => {
  const [installedApp, setInstalledApp] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0); 
  const [order, setOrder] = useState<Order | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState({ phone: '+591 ', name: '', front: '', back: '', selfie: '' });
  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  // Add missing isCustomer helper
  const isCustomer = installedApp === 'customer';

  const [myLocation, setMyLocation] = useState<Location>({
    lat: TRINIDAD_COORDS.lat,
    lng: TRINIDAD_COORDS.lng
  });

  useEffect(() => {
    const savedApp = localStorage.getItem('rapidingo_app_type') as AppRole;
    if (savedApp) setInstalledApp(savedApp);

    const savedUsers = localStorage.getItem('rapidingo_registered_users');
    if (savedUsers) {
      setRegisteredUsers(JSON.parse(savedUsers));
    } else {
      // Repartidores demo para pruebas iniciales en Trinidad
      const demoDeliveries: UserProfile[] = [
        { id: 'dev-1', role: 'delivery', name: 'Carlos Beni', isVerified: true, email: 'carlos@benimail.com', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' },
        { id: 'dev-2', role: 'delivery', name: 'Maria Rapidin', isVerified: true, email: 'maria@rapidin.com', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' }
      ];
      setRegisteredUsers(demoDeliveries);
    }

    const timer = setTimeout(() => setIsSplashActive(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('rapidingo_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const availableDeliveries = useMemo(() => {
    return registeredUsers.filter(u => u.role === 'delivery' && u.id !== profile?.id);
  }, [registeredUsers, profile]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(newLoc);
          if (order) {
            setOrder(prev => {
              if (!prev) return null;
              return {
                ...prev,
                [installedApp === 'customer' ? 'customerLocation' : 'deliveryLocation']: newLoc
              };
            });
          }
        },
        () => console.log("Usando Trinidad default"),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [installedApp, !!order]);

  // Simulación de movimiento del delivery
  useEffect(() => {
    let interval: any;
    if (isSimulationRunning && order && (order.status === OrderStatus.ON_THE_WAY || order.status === OrderStatus.NEAR)) {
      interval = setInterval(() => {
        setOrder(prev => {
          if (!prev) return null;
          const latDiff = (prev.customerLocation.lat - prev.deliveryLocation.lat);
          const lngDiff = (prev.customerLocation.lng - prev.deliveryLocation.lng);
          const newDeliveryLoc = {
            lat: prev.deliveryLocation.lat + latDiff * 0.1,
            lng: prev.deliveryLocation.lng + lngDiff * 0.1
          };
          const dist = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
          let nextStatus = prev.status;
          
          if (dist < 0.005 && dist > 0.0005 && prev.status !== OrderStatus.NEAR) {
            nextStatus = OrderStatus.NEAR;
            if (installedApp === 'customer') {
              setNotification("🔔 ¡Tu RAPIDINGO está a solo 5 minutos!");
            }
          }
          
          if (dist < 0.0001) {
            nextStatus = OrderStatus.DELIVERED;
            setIsSimulationRunning(false);
            if (installedApp === 'customer') {
              setNotification("✅ ¡El RAPIDINGO ha llegado a tu ubicación!");
            }
          }
          return { ...prev, deliveryLocation: newDeliveryLoc, status: nextStatus };
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulationRunning, order, installedApp]);

  const installApp = (type: AppRole) => {
    localStorage.setItem('rapidingo_app_type', type);
    setInstalledApp(type);
    setOnboardingStep(1);
  };

  const finalizeRegistration = (details: Partial<UserProfile>) => {
    const newProfile = { 
      id: Math.random().toString(36).substring(7),
      role: installedApp!,
      email: `${details.name?.replace(/\s/g, '').toLowerCase() || 'user'}@rapidingo.com`,
      name: details.name || "Usuario Rapidingo",
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.name || Math.random()}`,
      isVerified: true,
      ...details 
    };
    setProfile(newProfile);
    setRegisteredUsers(prev => [...prev, newProfile]);
    setOnboardingStep(3);
    setShowWelcome(true);

    // Notificación WhatsApp simulada
    const cleanPhone = (details.phone || '').replace(/\D/g, '');
    const welcomeMsg = `Bienvenido a RAPIDINGO! Tu cuenta en Trinidad como ${installedApp === 'delivery' ? 'Repartidor' : 'Cliente'} está lista.`;
    console.log(`Sending WA to ${cleanPhone}: ${welcomeMsg}`);
  };

  const handleStartOrder = (orderData: { category: string, details: string, store: string }) => {
    const newOrder: Order = {
      id: "RD-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
      ...orderData,
      status: OrderStatus.SELECTING_DELIVERY,
      customerLocation: myLocation,
      deliveryLocation: { lat: myLocation.lat + 0.015, lng: myLocation.lng - 0.015 },
      purchaseCost: 0,
      deliveryFee: 0,
      messages: [],
      customerConfirmed: false
    };
    setOrder(newOrder);
  };

  const selectDelivery = (delivery: UserProfile) => {
    setOrder(prev => prev ? { 
      ...prev, 
      status: OrderStatus.ASSIGNED, 
      deliveryId: delivery.id,
      deliveryName: delivery.name,
      deliveryPhoto: delivery.photoUrl
    } : null);
    setNotification(`Pedido enviado a ${delivery.name}. Esperando presupuesto.`);
  };

  const deliverySendCosts = (purchase: number, fee: number) => {
    setOrder(prev => prev ? { 
      ...prev, 
      purchaseCost: purchase, 
      deliveryFee: fee, 
      status: OrderStatus.WAITING_CONFIRMATION 
    } : null);
    setNotification("Costos enviados al cliente. Esperando confirmación.");
  };

  const clientConfirmOrder = () => {
    setOrder(prev => prev ? { ...prev, status: OrderStatus.CLIENT_CONFIRMED, customerConfirmed: true } : null);
    setNotification("Compra confirmada. Avisando al repartidor.");
  };

  const deliveryConfirmFinal = () => {
    setOrder(prev => prev ? { ...prev, status: OrderStatus.ON_THE_WAY } : null);
    setIsSimulationRunning(true);
    setNotification("OK voy en camino"); // Notificación al cliente simulada
  };

  // Add missing handleSendMessage function
  const handleSendMessage = (text: string) => {
    if (!order || !installedApp) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: installedApp,
      text,
      timestamp: Date.now()
    };
    setOrder(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);
  };

  const resetInstallation = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isSplashActive) {
    return (
      <div className="h-screen bg-[#E31B1B] flex flex-col items-center justify-center text-white p-6">
        <Bike className="animate-bounce mb-4" size={80} />
        <h1 className="text-5xl font-black italic">RAPIDINGO</h1>
        <p className="font-bold opacity-70 mt-2">TRINIDAD - BENI</p>
      </div>
    );
  }

  if (!installedApp) {
    return (
      <div className="flex flex-col h-screen bg-white p-8 justify-center gap-12">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#E31B1B] italic">RAPIDINGO</h1>
          <p className="text-gray-500 font-bold mt-2">Delivery Premium en Trinidad</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => installApp('customer')} className="w-full p-6 bg-white border-2 border-gray-100 rounded-[2rem] flex items-center gap-4 hover:border-[#E31B1B] transition-all text-left">
            <div className="bg-[#E31B1B] text-white p-3 rounded-2xl"><User /></div>
            <div><p className="font-black text-lg leading-none">Soy Cliente</p><p className="text-xs text-gray-400 font-bold">Quiero pedir algo</p></div>
          </button>
          <button onClick={() => installApp('delivery')} className="w-full p-6 bg-white border-2 border-gray-100 rounded-[2rem] flex items-center gap-4 hover:border-[#E31B1B] transition-all text-left">
            <div className="bg-gray-900 text-white p-3 rounded-2xl"><Bike /></div>
            <div><p className="font-black text-lg leading-none">Soy Delivery</p><p className="text-xs text-gray-400 font-bold">Quiero trabajar</p></div>
          </button>
        </div>
      </div>
    );
  }

  if (onboardingStep < 3) {
    return (
      <div className="flex flex-col h-screen bg-white p-8 animate-in fade-in">
        <h2 className="text-3xl font-black italic text-[#E31B1B] mb-8">REGISTRO</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-tighter">Tu Nombre</label>
            <input type="text" placeholder="Ej: Juan de Trinidad" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-tighter">Tu Celular</label>
            <input type="tel" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" value={formData.phone} onChange={e => { if(e.target.value.startsWith('+591 ')) setFormData(p => ({...p, phone: e.target.value}))}} />
          </div>
          {installedApp === 'delivery' && <CameraCapture label="Documento de Identidad" onCapture={(img) => setFormData(p => ({...p, front: img}))} />}
          <button 
            onClick={() => finalizeRegistration(formData)} 
            disabled={!formData.name || (installedApp === 'delivery' && !formData.front)}
            className="w-full bg-[#E31B1B] text-white p-5 rounded-2xl font-black shadow-xl disabled:opacity-50"
          >
            FINALIZAR Y REGISTRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Mensaje de Bienvenida */}
      {showWelcome && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in">
          <div className="bg-white p-10 rounded-[3rem] text-center space-y-6 max-w-sm">
            <Heart size={64} className="text-[#E31B1B] mx-auto animate-pulse" />
            <h2 className="text-2xl font-black italic">Bienvenido {installedApp === 'delivery' ? 'Repartidor' : 'Cliente'} a Delivery Rapidingo</h2>
            <button onClick={() => setShowWelcome(false)} className="w-full bg-[#E31B1B] text-white p-4 rounded-2xl font-black">ENTRAR</button>
          </div>
        </div>
      )}

      {/* Flujo de Pedido - Cliente */}
      {isCustomer && !order && (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <header className="flex justify-between items-center">
            <div><p className="text-[10px] font-black text-[#E31B1B]">TRINIDAD, BENI</p><h1 className="text-2xl font-black italic">RAPIDINGO</h1></div>
            <button onClick={resetInstallation} className="p-2 bg-gray-100 rounded-full"><User size={20}/></button>
          </header>
          
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(c => (
              <div key={c.id} className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <span className="text-3xl">{c.icon}</span>
                <p className="font-black mt-2 leading-none">{c.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-[3rem] space-y-4">
            <h3 className="text-xl font-black italic">¿Qué compramos por ti?</h3>
            <input id="store" placeholder="¿Dónde lo compramos? (Ej: Mercado Pompeya)" className="w-full p-4 bg-white/10 rounded-2xl border-none outline-none text-sm font-bold placeholder:text-gray-500" />
            <textarea id="details" placeholder="Describe tu pedido..." className="w-full p-4 bg-white/10 rounded-2xl border-none outline-none text-sm font-bold h-24 placeholder:text-gray-500" />
            <button 
              onClick={() => {
                const s = (document.getElementById('store') as HTMLInputElement).value;
                const d = (document.getElementById('details') as HTMLTextAreaElement).value;
                if(s && d) handleStartOrder({ category: 'Personalizado', store: s, details: d });
              }}
              className="w-full bg-[#E31B1B] p-4 rounded-2xl font-black uppercase tracking-tighter"
            >
              Solicitar Rapidingo
            </button>
          </div>
        </div>
      )}

      {/* Búsqueda de Repartidor (Cliente elige por foto) */}
      {isCustomer && order?.status === OrderStatus.SELECTING_DELIVERY && (
        <div className="flex-1 p-8 bg-gray-50 flex flex-col items-center justify-center text-center animate-in fade-in">
           <h2 className="text-2xl font-black italic mb-6">Selecciona tu Repartidor</h2>
           <div className="grid grid-cols-2 gap-6 w-full">
              {availableDeliveries.map(d => (
                <button key={d.id} onClick={() => selectDelivery(d)} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-[#E31B1B] transition-all">
                   <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gray-50">
                      <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                   </div>
                   <p className="font-black text-sm">{d.name}</p>
                   <p className="text-[10px] text-green-500 font-bold uppercase mt-1">✓ Disponible</p>
                </button>
              ))}
           </div>
           <button onClick={() => setOrder(null)} className="mt-8 text-gray-400 font-bold underline">CANCELAR</button>
        </div>
      )}

      {/* DASHBOARD REPARTIDOR (Esperando o Atendiendo) */}
      {!isCustomer && (
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
           {!order ? (
             <>
               <div className="w-32 h-32 bg-[#E31B1B]/10 rounded-full flex items-center justify-center text-[#E31B1B] animate-pulse">
                 <Bike size={64} />
               </div>
               <h2 className="text-2xl font-black italic">ESPERANDO PEDIDOS EN TRINIDAD...</h2>
               <p className="text-gray-400 font-bold text-sm">Mantén el app abierto para recibir solicitudes.</p>
               <button onClick={() => {
                 // Simulador de pedido para pruebas
                 setOrder({
                   id: "RD-DEMO",
                   category: 'Mercado',
                   store: 'Mercado Fátima',
                   details: '2 Kg de Harina, 1 Aceite',
                   status: OrderStatus.ASSIGNED,
                   customerLocation: { lat: TRINIDAD_COORDS.lat + 0.005, lng: TRINIDAD_COORDS.lng + 0.005 },
                   deliveryLocation: myLocation,
                   purchaseCost: 0, deliveryFee: 0, messages: [], customerConfirmed: false,
                   deliveryName: profile?.name, deliveryId: profile?.id
                 });
               }} className="p-3 bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">Simular Pedido Entrante</button>
             </>
           ) : (
             <div className="w-full space-y-6">
                <div className="bg-white border-4 border-[#E31B1B] rounded-[3rem] p-8 shadow-2xl space-y-6">
                   <h3 className="text-xl font-black italic">NUEVO PEDIDO ASIGNADO</h3>
                   <div className="bg-gray-50 p-6 rounded-3xl text-left border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">TIENDA</p>
                      <p className="font-black text-gray-800">{order.store}</p>
                      <p className="text-sm text-gray-500 mt-2">"{order.details}"</p>
                   </div>
                   
                   {order.status === OrderStatus.ASSIGNED && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <input id="pCost" type="number" placeholder="Costo Compra Bs" className="p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-[#E31B1B]" />
                           <input id="dFee" type="number" placeholder="Costo Envío Bs" className="p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-[#E31B1B]" />
                        </div>
                        <button 
                          onClick={() => {
                            const p = Number((document.getElementById('pCost') as HTMLInputElement).value);
                            const d = Number((document.getElementById('dFee') as HTMLInputElement).value);
                            if(p && d) deliverySendCosts(p, d);
                          }}
                          className="w-full bg-[#E31B1B] text-white p-4 rounded-2xl font-black shadow-lg"
                        >
                          ENVIAR PRECIO AL CLIENTE
                        </button>
                     </div>
                   )}

                   {order.status === OrderStatus.CLIENT_CONFIRMED && (
                      <div className="space-y-4 animate-in bounce-in">
                         <div className="p-4 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
                            <CheckCircle className="text-green-500" />
                            <p className="text-sm font-black text-green-700">¡EL CLIENTE CONFIRMÓ EL PAGO!</p>
                         </div>
                         <button onClick={deliveryConfirmFinal} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black text-lg">
                           OK COMPRA REALIZADA
                         </button>
                      </div>
                   )}

                   {order.status === OrderStatus.ON_THE_WAY && (
                      <div className="bg-blue-600 text-white p-6 rounded-3xl space-y-2">
                         <p className="font-black">EN CAMINO A DESTINO</p>
                         <p className="text-xs opacity-80">El cliente está viendo tu ubicación en tiempo real.</p>
                      </div>
                   )}
                </div>
                <button onClick={() => setOrder(null)} className="text-gray-400 font-bold underline">CERRAR GESTIÓN</button>
             </div>
           )}
        </div>
      )}

      {/* VISTA DE RASTREO (CLIENTE) */}
      {isCustomer && order && order.status !== OrderStatus.SELECTING_DELIVERY && (
        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom">
           <div className="h-2/5 relative">
              <MapDisplay customerLoc={order.customerLocation} deliveryLoc={order.deliveryLocation} role="customer" />
              {order.status === OrderStatus.ON_THE_WAY && (
                 <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-[#E31B1B] animate-pulse">
                    <Bike className="text-[#E31B1B]" />
                    <p className="font-black text-sm uppercase">OK voy en camino</p>
                 </div>
              )}
           </div>

           <div className="flex-1 bg-white rounded-t-[3rem] -mt-8 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-2xl font-black italic tracking-tighter">ESTADO DEL PEDIDO</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.id}</p>
                 </div>
                 {order.deliveryPhoto && (
                   <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
                      <img src={order.deliveryPhoto} alt="Delivery" />
                   </div>
                 )}
              </div>

              {/* Pantalla de Confirmación de Precios */}
              {order.status === OrderStatus.WAITING_CONFIRMATION && (
                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-6 shadow-sm mb-6">
                   <div className="flex justify-between items-center pb-4 border-b border-gray-200 border-dashed">
                      <p className="text-xs font-bold text-gray-400 uppercase">Productos</p>
                      <p className="font-black text-lg">Bs {order.purchaseCost}</p>
                   </div>
                   <div className="flex justify-between items-center pb-4 border-b border-gray-200 border-dashed">
                      <p className="text-xs font-bold text-gray-400 uppercase">Servicio Delivery</p>
                      <p className="font-black text-lg">Bs {order.deliveryFee}</p>
                   </div>
                   <div className="flex justify-between items-center pt-2">
                      <p className="font-black text-[#E31B1B] uppercase italic">Total a Pagar</p>
                      <p className="text-3xl font-black italic tracking-tighter">Bs {order.purchaseCost + order.deliveryFee}</p>
                   </div>
                   <button onClick={clientConfirmOrder} className="w-full bg-[#E31B1B] text-white p-5 rounded-2xl font-black shadow-xl shadow-[#E31B1B]/20">CONFIRMAR Y PAGAR</button>
                </div>
              )}

              {/* Información de envío */}
              <div className="space-y-4">
                 <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <div className="bg-white p-3 rounded-2xl shadow-sm"><MapPin size={20} className="text-[#E31B1B]" /></div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Punto de compra</p>
                       <p className="font-black text-sm">{order.store}</p>
                    </div>
                 </div>
                 
                 <div className="h-64 border rounded-[2rem] overflow-hidden">
                    <ChatBox messages={order.messages} role="customer" onSendMessage={handleSendMessage} />
                 </div>
              </div>
              <button onClick={() => setOrder(null)} className="w-full mt-6 py-4 text-gray-300 font-bold text-xs uppercase tracking-widest">Cerrar Seguimiento</button>
           </div>
        </div>
      )}

      {/* Nav Inferior */}
      {!order && (
        <nav className="bg-white border-t p-4 px-10 flex items-center justify-between sticky bottom-0 z-[100] pb-8">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-[#E31B1B]' : 'text-gray-400'}`}>
             <Home size={24} /><span className="text-[9px] font-black">INICIO</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'orders' ? 'text-[#E31B1B]' : 'text-gray-400'}`}>
             <FileText size={24} /><span className="text-[9px] font-black">PEDIDOS</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-[#E31B1B]' : 'text-gray-400'}`}>
             <User size={24} /><span className="text-[9px] font-black">PERFIL</span>
          </button>
        </nav>
      )}

      {/* Notificaciones flotantes */}
      {notification && (
        <div className="fixed top-6 left-6 right-6 z-[6000] bg-gray-900 text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="bg-[#E31B1B] p-2 rounded-xl"><Bell size={16}/></div>
          <p className="text-xs font-black flex-1 uppercase tracking-tighter">{notification}</p>
          <button onClick={() => setNotification(null)}><XCircle size={16} className="opacity-50" /></button>
        </div>
      )}
    </div>
  );
};

export default App;