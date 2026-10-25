'use client';

import { useEffect } from 'react';
import { initMagicMouse } from '../core/magicMouse';

export default function MagicMouse() {
  useEffect(() => {
    initMagicMouse();
  }, []);

  return null;
}
