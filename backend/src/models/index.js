import User from './user.model.js';
import Building from './building.model.js';
import Floor from './floor.model.js';
import ParkingSlot from './parking-slot.model.js';
import ParkingRow from './parking-row.model.js';
import ParkingSession from './parking-session.model.js';
import ParkingBooking from './parking-booking.model.js';
import ParkingPackage from './parking-package.model.js';
import ResidentSubscription from './resident-subscription.model.js';
import Payment from './payment.model.js';

Building.hasMany(Floor, { foreignKey: 'buildingId', as: 'floors', onDelete: 'RESTRICT' });
Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Floor.hasMany(ParkingSlot, { foreignKey: 'floorId', as: 'slots', onDelete: 'RESTRICT' });
ParkingSlot.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

Floor.hasMany(ParkingBooking, { foreignKey: 'floorId', as: 'bookings' });
ParkingBooking.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

Floor.hasMany(ParkingRow, { foreignKey: 'floorId', as: 'rows', onDelete: 'RESTRICT' });
ParkingRow.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

ParkingSlot.hasMany(ParkingSession, { foreignKey: 'slotId', as: 'sessions' });
ParkingSession.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });

ParkingRow.hasMany(ParkingSession, { foreignKey: 'rowId', as: 'sessions' });
ParkingSession.belongsTo(ParkingRow, { foreignKey: 'rowId', as: 'row' });

ParkingSlot.hasMany(ParkingBooking, { foreignKey: 'slotId', as: 'bookings' });
ParkingBooking.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });

User.hasMany(ParkingSession, { foreignKey: 'staffId', as: 'staffedSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });

User.hasMany(ParkingSession, { foreignKey: 'userId', as: 'userSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ParkingBooking, { foreignKey: 'userId', as: 'bookings' });
ParkingBooking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ParkingBooking, { foreignKey: 'handledBy', as: 'handledBookings' });
ParkingBooking.belongsTo(User, { foreignKey: 'handledBy', as: 'staff' });

ParkingSession.hasOne(ParkingBooking, { foreignKey: 'sessionId', as: 'booking' });
ParkingBooking.belongsTo(ParkingSession, { foreignKey: 'sessionId', as: 'session' });

// ── Resident package subscriptions ──
ParkingPackage.hasMany(ResidentSubscription, { foreignKey: 'packageId', as: 'subscriptions', onDelete: 'RESTRICT' });
ResidentSubscription.belongsTo(ParkingPackage, { foreignKey: 'packageId', as: 'package' });

User.hasMany(ResidentSubscription, { foreignKey: 'userId', as: 'subscriptions' });
ResidentSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ResidentSubscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments', onDelete: 'SET NULL' });
Payment.belongsTo(ResidentSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Car packages reserve a fixed slot
ParkingSlot.hasMany(ResidentSubscription, { foreignKey: 'slotId', as: 'subscriptions' });
ResidentSubscription.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });
