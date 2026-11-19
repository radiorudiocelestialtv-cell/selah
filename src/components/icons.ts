// Iconos del sprite de public/selah.html mas bell, plus y dots del prototipo movil.
export const ICONS = {
  home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>',
  live: '<circle cx="12" cy="12" r="2.5"/><path d="M7 7a7 7 0 000 10M17 7a7 7 0 010 10M4 4a11 11 0 000 16M20 4a11 11 0 010 16"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M16 4.5a3.5 3.5 0 010 7M22 20c0-3-2-5-4-5.5"/>',
  store: '<path d="M4 9l1-5h14l1 5M5 9v11h14V9M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v5M4.5 12.5h5M16 11h.01M18 14h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-5 4 3 3-2 5 4"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/>',
  heart: '<path d="M12 21C5 15 3 11 3 8a4.5 4.5 0 019-1 4.5 4.5 0 019 1c0 3-2 7-9 13z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  bell: '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  dots: '<path d="M12 5h.01M12 12h.01M12 19h.01"/>',
} as const;

export type IconName = keyof typeof ICONS;
