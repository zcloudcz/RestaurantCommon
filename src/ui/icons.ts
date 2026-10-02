export function icon(name: string, size = 22) {
  const paths: Record<string, string> = {
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    fire: '<path d="M12 2c2 5-3 6-1 10 2-1 3-3 3-5 9 9 5 15-2 15S2 15 6 9c0 4 2 5 3 5-2-6 1-7 3-12Z"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/>',
    chair: '<path d="M6 12V4h12v8M4 12h16v5H4zm2 5v4m12-4v4"/>',
    spark:
      '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
    car: '<path d="m5 7 2-4h10l2 4 2 3v8H3v-8Zm-2 3h18M6 18v3m12-3v3M6 13h2m8 0h2"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sound:
      '<path d="M4 9h4l5-5v16l-5-5H4Zm12-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
    mute: '<path d="M4 9h4l5-5v16l-5-5H4Zm13 0 5 6m0-6-5 6"/>',
    settings:
      '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    bag: '<path d="M5 7h14l1 14H4Zm3 0V5a4 4 0 0 1 8 0v2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
    trophy:
      '<path d="M7 3h10v5a5 5 0 0 1-10 0Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 1v6m-5 2h10"/>',
    list: '<path d="m3 6 1 1 2-3m3 2h12M3 12l1 1 2-3m3 2h12M3 18l1 1 2-3m3 2h12"/>',
    pause: '<path d="M8 4v16M16 4v16"/>',
    play: '<path d="m7 3 14 9-14 9Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    chef: '<path d="M6 16v5h12v-5M6 16V9a4 4 0 1 1 3-7 4 4 0 0 1 6 0 4 4 0 1 1 3 7v7Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 3h.01"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.star}</svg>`;
}
