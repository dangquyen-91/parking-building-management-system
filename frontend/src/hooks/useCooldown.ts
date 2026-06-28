import { useCallback, useEffect, useState } from 'react';

/**
 * Đếm ngược cooldown lưu trong localStorage → không bị reset khi F5,
 * không spam được bằng cách refresh trang. Dùng cho các nút "Gửi lại email".
 */
export function useCooldown(storageKey: string, durationSec = 60) {
  const compute = useCallback(() => {
    const until = Number(localStorage.getItem(storageKey) || 0);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  }, [storageKey]);

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    const id = setInterval(() => setRemaining(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);

  const start = useCallback(() => {
    localStorage.setItem(storageKey, String(Date.now() + durationSec * 1000));
    setRemaining(durationSec);
  }, [storageKey, durationSec]);

  return { remaining, active: remaining > 0, start };
}
