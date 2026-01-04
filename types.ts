
export enum OrderStatus {
  PENDING = 'PENDING',               // Cliente redactando pedido
  SELECTING_DELIVERY = 'SELECTING_DELIVERY', // Cliente eligiendo entre repartidores registrados
  ASSIGNED = 'ASSIGNED',             // Repartidor elegido, esperando que este ponga precios
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION', // Repartidor envió precios, esperando cliente
  CLIENT_CONFIRMED = 'CLIENT_CONFIRMED', // Cliente aceptó el monto total
  ON_THE_WAY = 'ON_THE_WAY',         // Repartidor confirmó compra ("OK voy en camino")
  NEAR = 'NEAR',                     // A 5 minutos
  DELIVERED = 'DELIVERED'            // Entregado
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Message {
  id: string;
  sender: 'customer' | 'delivery';
  text: string;
  timestamp: number;
}

export interface Order {
  id: string;
  category: string;
  details: string;
  store: string;
  status: OrderStatus;
  customerLocation: Location;
  deliveryLocation: Location;
  purchaseCost: number;
  deliveryFee: number;
  messages: Message[];
  customerConfirmed: boolean;
  deliveryId?: string;
  deliveryName?: string;
  deliveryPhoto?: string;
}

export type AppRole = 'customer' | 'delivery';

export interface UserProfile {
  id: string;
  role: AppRole;
  email: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  idPhotoFront?: string;
  idPhotoBack?: string;
  selfie?: string;
  isVerified: boolean;
}
