import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KioskHotkeys {
  onEscape?: () => void;
  onCtrlL?: () => void;
}

export function useKioskHotkeys(options: KioskHotkeys = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      switch (e.key) {
        case 'F1':
          if (isTyping) break;
          e.preventDefault();
          navigate('/staff/dashboard');
          break;
        case 'F2':
          if (isTyping) break;
          e.preventDefault();
          navigate('/staff/check-in');
          break;
        case 'F3':
          if (isTyping) break;
          e.preventDefault();
          navigate('/staff/sessions');
          break;
        case 'F4':
          if (isTyping) break;
          e.preventDefault();
          navigate('/staff/map');
          break;
        case 'Escape':
          options.onEscape?.();
          break;
        case 'l':
        case 'L':
          if (e.ctrlKey && !isTyping) {
            e.preventDefault();
            options.onCtrlL?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, options.onEscape, options.onCtrlL]);
}
