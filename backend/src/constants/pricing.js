// Flat parking fee for visitor (per-session, regardless of duration), in VND.
// Residents with an active subscription are charged 0 (covered by their package).
export const VISITOR_FLAT_FEE = {
  motorcycle: 5000,
  car: 20000,
};

export const getVisitorFlatFee = (vehicleType) => VISITOR_FLAT_FEE[vehicleType] ?? 0;
