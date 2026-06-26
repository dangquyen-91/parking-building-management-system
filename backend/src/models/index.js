import User from './user.model.js';
import Role from './role.model.js';
import Building from './building.model.js';
import Floor from './floor.model.js';
import ParkingSlot from './parking-slot.model.js';
import ParkingRow from './parking-row.model.js';
import ParkingSession from './parking-session.model.js';
import ParkingPackage from './parking-package.model.js';
import ResidentSubscription from './resident-subscription.model.js';
import Booking from './booking.model.js';
import SubscriptionPayment from './subscription-payment.model.js';
import BookingPayment from './booking-payment.model.js';
import SessionPayment from './session-payment.model.js';

Role.hasMany(User, { foreignKey: 'roleId', as: 'users', onDelete: 'RESTRICT' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Building.hasMany(Floor, { foreignKey: 'buildingId', as: 'floors', onDelete: 'RESTRICT' });
Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Floor.hasMany(ParkingSlot, { foreignKey: 'floorId', as: 'slots', onDelete: 'RESTRICT' });
ParkingSlot.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

Floor.hasMany(ParkingRow, { foreignKey: 'floorId', as: 'rows', onDelete: 'RESTRICT' });
ParkingRow.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

ParkingSlot.hasMany(ParkingSession, { foreignKey: 'slotId', as: 'sessions' });
ParkingSession.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });

ParkingRow.hasMany(ParkingSession, { foreignKey: 'rowId', as: 'sessions' });
ParkingSession.belongsTo(ParkingRow, { foreignKey: 'rowId', as: 'row' });

Floor.hasMany(ParkingSession, { foreignKey: 'floorId', as: 'sessions' });
ParkingSession.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

User.hasMany(ParkingSession, { foreignKey: 'staffId', as: 'staffedSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });

User.hasMany(ParkingSession, { foreignKey: 'userId', as: 'userSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ParkingPackage.hasMany(ResidentSubscription, { foreignKey: 'packageId', as: 'subscriptions', onDelete: 'RESTRICT' });
ResidentSubscription.belongsTo(ParkingPackage, { foreignKey: 'packageId', as: 'package' });

User.hasMany(ResidentSubscription, { foreignKey: 'userId', as: 'subscriptions' });
ResidentSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ParkingSlot.hasMany(ResidentSubscription, { foreignKey: 'slotId', as: 'subscriptions' });
ResidentSubscription.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });

ParkingRow.hasMany(ResidentSubscription, { foreignKey: 'rowId', as: 'subscriptions' });
ResidentSubscription.belongsTo(ParkingRow, { foreignKey: 'rowId', as: 'row' });

Floor.hasMany(Booking, { foreignKey: 'floorId', as: 'bookings', onDelete: 'RESTRICT' });
Booking.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Booking, { foreignKey: 'handledBy', as: 'handledBookings' });
Booking.belongsTo(User, { foreignKey: 'handledBy', as: 'handler' });

ParkingSession.hasOne(Booking, { foreignKey: 'sessionId', as: 'booking' });
Booking.belongsTo(ParkingSession, { foreignKey: 'sessionId', as: 'session' });

ResidentSubscription.hasMany(SubscriptionPayment, { foreignKey: 'subscriptionId', as: 'payments', onDelete: 'CASCADE' });
SubscriptionPayment.belongsTo(ResidentSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

Booking.hasMany(BookingPayment, { foreignKey: 'bookingId', as: 'payments', onDelete: 'CASCADE' });
BookingPayment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

ParkingSession.hasMany(SessionPayment, { foreignKey: 'sessionId', as: 'payments', onDelete: 'CASCADE' });
SessionPayment.belongsTo(ParkingSession, { foreignKey: 'sessionId', as: 'session' });
