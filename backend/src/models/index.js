import User from './user.model.js';
import Building from './building.model.js';
import Floor from './floor.model.js';
import ParkingSlot from './parking-slot.model.js';
import ParkingSession from './parking-session.model.js';

Building.hasMany(Floor, { foreignKey: 'buildingId', as: 'floors', onDelete: 'RESTRICT' });
Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

Floor.hasMany(ParkingSlot, { foreignKey: 'floorId', as: 'slots', onDelete: 'RESTRICT' });
ParkingSlot.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor' });

ParkingSlot.hasMany(ParkingSession, { foreignKey: 'slotId', as: 'sessions' });
ParkingSession.belongsTo(ParkingSlot, { foreignKey: 'slotId', as: 'slot' });

User.hasMany(ParkingSession, { foreignKey: 'staffId', as: 'staffedSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });

User.hasMany(ParkingSession, { foreignKey: 'userId', as: 'residentSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'userId', as: 'resident' });
