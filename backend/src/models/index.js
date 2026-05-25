import User from './user.model.js';
import Building from './building.model.js';
import Floor from './floor.model.js';
import ParkingSlot from './parking-slot.model.js';
import ParkingRow from './parking-row.model.js';
import ParkingSession from './parking-session.model.js';

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

User.hasMany(ParkingSession, { foreignKey: 'staffId', as: 'staffedSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });

User.hasMany(ParkingSession, { foreignKey: 'userId', as: 'userSessions' });
ParkingSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
