// ─── Primitives ──────────────────────────────────────────────────────────────
export type VehicleType = 'car' | 'motorcycle';
export type SlotStatus = 'empty' | 'occupied' | 'reserved' | 'maintenance';
export type RowStatus = 'available' | 'full' | 'maintenance';
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'vnpay';
export type FloorType = 'resident' | 'visitor';

// ─── Lookup API Response ─────────────────────────────────────────────────────
// GET /parking-sessions/lookup
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

// ─── Subscription API Response ───────────────────────────────────────────────
// GET /subscriptions/active
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
  slot: { id: number; slotCode: string } | null;
}

export interface SubscriptionApiResponse {
  active: boolean;
  subscription: ActiveSubscription | null;
}

// ─── Booking API Response ─────────────────────────────────────────────────────
// GET /parking-bookings
export interface BookingFloor {
  id: number;
  floorNumber: number;
  floorType: FloorType;
  vehicleType: VehicleType;
  building: { id: number; name: string };
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
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  vehicleType: VehicleType;
  startTime: string | null;
  endTime: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  note: string | null;
  staffNote: string | null;
  handledBy: number | null;
  handledAt: string | null;
  sessionId: number | null;
  createdAt: string;
  floor: BookingFloor;
  slot: BookingSlot | null;
  // Nested session object returned by GET /parking-bookings and POST /{id}/confirm
  session: { id: number; entryTime: string; status: string } | null;
}

// ─── Parking Slots / Rows ─────────────────────────────────────────────────────
// GET /parking-slots?status=empty&vehicleType=car
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

// GET /parking-rows?status=available&vehicleType=motorcycle
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

// ─── Check-In Payloads & Responses ───────────────────────────────────────────
// POST /parking-sessions/check-in
export interface CheckInCarPayload {
  vehicleType: 'car';
  licensePlate: string;
  slotId: number;
  userId?: number;
}

export interface CheckInMotoPayload {
  vehicleType: 'motorcycle';
  licensePlate: string;
  rowId: number;
  userId?: number;
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
}

// POST /parking-bookings/{id}/confirm
export interface ConfirmBookingPayload {
  slotId?: number;
  staffNote?: string;
}

// ─── Active Sessions ──────────────────────────────────────────────────────────
// GET /parking-sessions
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
  slot?: { id: number; slotCode: string; floor?: { floorNumber: number } } | null;
  row?: { id: number; rowCode: string; floor?: { floorNumber: number } } | null;
  user?: { id: number; fullName: string; email: string } | null;
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

// ─── Checkout ─────────────────────────────────────────────────────────────────
// GET /parking-sessions/{id}/checkout-preview
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

// POST /parking-sessions/{id}/check-out
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

// ─── Parking Map ──────────────────────────────────────────────────────────────
// GET /floors
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
