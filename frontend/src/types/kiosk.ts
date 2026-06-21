export type VehicleType = 'car' | 'motorcycle';
export type SlotStatus = 'empty' | 'occupied' | 'reserved' | 'maintenance';
export type RowStatus = 'available' | 'full' | 'maintenance';
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'vnpay';
export type FloorType = 'resident' | 'visitor';

export interface LookupLinkedResident {
  id: number;
  fullName: string;
  phone: string;
  email: string;
}

export interface LookupLastVisit {
  vehicleType: VehicleType;
  entryTime: string;
  exitTime: string;
  fee: string | number;
}

export interface LookupActiveSession {
  id: number;
  vehicleType: VehicleType;
  entryTime: string;
  slotCode?: string;
  rowCode?: string;
  slot?: {
    id: number;
    slotCode: string;
    floorId?: number;
    floor?: {
      id: number;
      floorNumber: number;
      building?: { id: number; name: string };
    };
  } | null;
  row?: {
    id: number;
    rowCode: string;
    floorId?: number;
    floor?: {
      id: number;
      floorNumber: number;
      building?: { id: number; name: string };
    };
  } | null;
  status: string;
}

export interface LookupApiResponse {
  licensePlate: string;
  status: 'available' | 'already_active' | 'active';
  activeSession: LookupActiveSession | null;
  hint: {
    linkedResident: LookupLinkedResident | null;
    lastVisit: LookupLastVisit | null;
  };
  availableSlots: {
    motorcycle: number;
    car: number;
  };
}

export interface ActiveSubscriptionPackage {
  id: number;
  name: string;
  vehicleType: VehicleType;
  durationDays: number;
  price: string;
}

export interface ActiveSubscriptionUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface ActiveSubscription {
  id: number;
  userId: number;
  packageId: number;
  slotId: number | null;
  licensePlate: string;
  vehicleType: VehicleType;
  amount: string;
  startDate: string;
  endDate: string;
  status: string;
  package: ActiveSubscriptionPackage;
  user: ActiveSubscriptionUser;
  slot: { id: number; slotCode: string; floorId?: number; status?: SlotStatus } | null;
}

export interface SubscriptionApiResponse {
  active: boolean;
  subscription: ActiveSubscription | null;
}

export interface BookingFloor {
  id: number;
  floorNumber: number;
  buildingId?: number;
  floorType?: FloorType;
  vehicleType?: VehicleType;
  building?: { id: number; name: string };
}

export interface BookingSlot {
  id: number;
  slotCode: string;
  floorId: number;
  status: SlotStatus;
}

export interface BookingApiItem {
  id: number;
  floorId: number;
  slotId: number | null;
  userId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string;
  licensePlate: string;
  vehicleType: VehicleType;
  startTime: string | null;
  endTime: string | null;
  amount: string | number;
  prepaidHours: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  note: string | null;
  staffNote: string | null;
  handledBy: number | null;
  handledAt: string | null;
  sessionId: number | null;
  createdAt: string;
  floor: BookingFloor;
  slot: BookingSlot | null;
  session: { id: number; entryTime: string; status: string } | null;
}

export interface ParkingSlotApiItem {
  id: number;
  floorId: number;
  slotCode: string;
  vehicleType: VehicleType;
  status: SlotStatus;
  note: string | null;
  floor?: {
    id: number;
    floorNumber: number;
    floorType: FloorType;
    vehicleType: VehicleType;
    building?: { id: number; name: string };
  };
}

export interface ParkingRowApiItem {
  id: number;
  floorId: number;
  rowCode: string;
  capacity: number;
  occupiedCount: number;
  status: RowStatus;
  note: string | null;
  floor?: {
    id: number;
    floorNumber: number;
    floorType: FloorType;
    vehicleType: VehicleType;
    building?: { id: number; name: string };
  };
}

export interface CheckInCarPayload {
  vehicleType: 'car';
  licensePlate: string;
  floorId: number;
  userId?: number;
  note?: string;
}

export interface CheckInMotoPayload {
  vehicleType: 'motorcycle';
  licensePlate: string;
  floorId: number;
  rowId?: number;
  userId?: number;
  note?: string;
}

export type CheckInPayload = CheckInCarPayload | CheckInMotoPayload;

export interface CheckInApiResponse {
  id: number;
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime: string;
  status: string;
  note: string | null;
  slot: {
    id: number;
    slotCode: string;
    floor: { id: number; floorNumber: number; building: { id: number; name: string } };
  } | null;
  row: {
    id: number;
    rowCode: string;
    floor: { id: number; floorNumber: number; building: { id: number; name: string } };
  } | null;
  staffId: number;
  userId: number | null;
  bookingId?: number | null;
  prepaidHours?: number | null;
  prepaidAmount?: number | null;
  paymentStatus?: string;
}

export interface ConfirmBookingPayload {
  slotId?: number;
  staffNote?: string;
}

export interface ActiveSessionApiItem {
  id: number;
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime: string;
  exitTime: string | null;
  fee: string;
  status: SessionStatus;
  staffId: number;
  userId: number | null;
  slotId: number | null;
  rowId: number | null;
  floorId?: number | null;
  paymentStatus?: 'paid' | 'unpaid';
  prepaidHours?: number | null;
  prepaidAmount?: string | number | null;
  bookingId?: number | null;
  note?: string | null;
  slot?: { id: number; slotCode: string; floor?: { floorNumber: number; building?: { id: number; name: string } } } | null;
  row?: { id: number; rowCode: string; floor?: { floorNumber: number; building?: { id: number; name: string } } } | null;
  user?: { id: number; fullName: string; email: string } | null;
  staff?: { id: number; fullName: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CheckoutPreviewApiResponse {
  sessionId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime: string;
  now: string;
  durationMinutes: number;
  floorType: FloorType | null;
  covered: boolean;
  coveredBy: 'subscription' | 'booking' | null;
  prepaidHours: number | null;
  prepaidAmount: number | null;
  fee: number;
  breakdown: {
    baseFee?: number;
    overnightFee?: number;
    totalFee?: number;
    mode?: string;
    durationMinutes?: number;
    overnightNights?: number;
  } | null;
  suggestedPaymentMethod: 'package' | 'cash_or_vnpay';
}

export interface CheckOutPayload {
  paymentMethod: PaymentMethod;
}

export interface CheckOutApiResponse {
  sessionId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  entryTime: string;
  exitTime: string | null;
  durationMinutes?: number;
  fee: number;
  covered: boolean;
  coveredBy: 'subscription' | 'booking' | null;
  paymentMethod: PaymentMethod | 'package';
  paymentId?: number | null;
  paymentUrl?: string | null;
  orderId?: string | null;
  breakdown: CheckoutPreviewApiResponse['breakdown'];
}

export interface FloorApiItem {
  id: number;
  buildingId: number;
  floorNumber: number;
  vehicleType: VehicleType;
  floorType: FloorType;
  totalSlots: number;
  description: string | null;
  isActive: boolean;
}
