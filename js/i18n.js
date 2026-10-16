// Локализация: RU / EN / DE / FR. Язык по умолчанию — язык браузера (системный).
const I18N = (() => {
  const D = {
    ru: {
      title1: 'ЧЕРЕПАШКИ', title2: 'НИНДЗЯ', press: 'НАЖМИТЕ ENTER',
      play: 'Играть', lang: 'Язык: {0}', sound: 'Звук: {0}', on: 'ВКЛ', off: 'ВЫКЛ',
      nosave: 'ПРОГРЕСС НЕ СОХРАНЯЕТСЯ', age: '12+',
      choose: 'ВЫБЕРИ ГЕРОЯ', hero0: 'Синий', hero1: 'Красный', hero2: 'Лиловый', hero3: 'Рыжий',
      c1: 'СТРЕЛКИ / A D - ХОДЬБА', c2: 'ПРОБЕЛ / W - ПРЫЖОК', c3: 'J-МЕЧ  K-ЩИТ  L-СЮРИКЕН', c4: 'ESC / P - ПАУЗА',
      levels: 'УРОВНИ', hud_level: 'УР {0}/40', zone: 'ЗОНА {0}: {1}', z0: 'ЛЕС', z1: 'ЗАМОК', z2: 'ПОДЗЕМЕЛЬЕ',
      hint: 'ДОЙДИ ОТ A ДО B!',
      done: 'УРОВЕНЬ {0} ПРОЙДЕН!', earned: 'Монеты: +{0}', bonus: 'Бонус за финиш: +{0}', total: 'Всего монет: {0}',
      next: 'Дальше', map: 'Карта', back: 'Назад',
      shop: 'Прокачка', sk_atk: 'Атака', sk_def: 'Защита', sk_hp: 'Здоровье', lv: 'Ур.{0}/{1}', max: 'МАКС',
      atk_info: 'Меч {0} Звезда {1}', def_info: 'Урон -{0}%', hp_info: '{0} HP', nomoney: 'НЕ ХВАТАЕТ МОНЕТ',
      bank: 'Банк', pack: '+{0} монет', demo: 'ДЕМО: настоящие деньги не списываются.', bought: 'Куплено: +{0} монет',
      ad: 'Реклама +{0}', ad_title: 'РЕКЛАМА', ad_brand: 'ПИЦЦА-ПАЛАС', ad_slogan: 'ГОРЯЧАЯ ПИЦЦА ЗА 5 МИНУТ!',
      ad_wait: 'Награда через {0}', ad_close: 'Закрыть +{0}',
      pause: 'ПАУЗА', resume: 'Продолжить', quit: 'К карте',
      gameover: 'ИГРА ОКОНЧЕНА', retry: 'Ещё раз',
      win: 'ПОБЕДА!', win_text: 'ВСЕ 40 УРОВНЕЙ ПРОЙДЕНЫ!',
    },
    en: {
      title1: 'TURTLE', title2: 'NINJA QUEST', press: 'PRESS ENTER',
      play: 'Play', lang: 'Language: {0}', sound: 'Sound: {0}', on: 'ON', off: 'OFF',
      nosave: 'PROGRESS IS NOT SAVED', age: '12+',
      choose: 'CHOOSE YOUR HERO', hero0: 'Blue', hero1: 'Red', hero2: 'Purple', hero3: 'Orange',
      c1: 'ARROWS / A D - MOVE', c2: 'SPACE / W - JUMP', c3: 'J-SWORD  K-SHIELD  L-STAR', c4: 'ESC / P - PAUSE',
      levels: 'LEVELS', hud_level: 'LV {0}/40', zone: 'ZONE {0}: {1}', z0: 'FOREST', z1: 'CASTLE', z2: 'DUNGEON',
      hint: 'REACH B FROM A!',
      done: 'LEVEL {0} CLEAR!', earned: 'Coins: +{0}', bonus: 'Finish bonus: +{0}', total: 'Total coins: {0}',
      next: 'Next', map: 'Map', back: 'Back',
      shop: 'Upgrades', sk_atk: 'Attack', sk_def: 'Defense', sk_hp: 'Health', lv: 'Lv.{0}/{1}', max: 'MAX',
      atk_info: 'Sword {0} Star {1}', def_info: 'Damage -{0}%', hp_info: '{0} HP', nomoney: 'NOT ENOUGH COINS',
      bank: 'Bank', pack: '+{0} coins', demo: 'DEMO: no real money is charged.', bought: 'Bought: +{0} coins',
      ad: 'Watch Ad +{0}', ad_title: 'ADVERTISEMENT', ad_brand: 'PIZZA PALACE', ad_slogan: 'HOT PIZZA IN 5 MINUTES!',
      ad_wait: 'Reward in {0}', ad_close: 'Close +{0}',
      pause: 'PAUSED', resume: 'Resume', quit: 'To map',
      gameover: 'GAME OVER', retry: 'Retry',
      win: 'VICTORY!', win_text: 'ALL 40 LEVELS CLEARED!',
    },
    de: {
      title1: 'NINJA', title2: 'SCHILDKRÖTEN', press: 'ENTER DRÜCKEN',
      play: 'Spielen', lang: 'Sprache: {0}', sound: 'Ton: {0}', on: 'AN', off: 'AUS',
      nosave: 'KEIN SPEICHERSTAND', age: '12+',
      choose: 'WÄHLE DEINEN HELDEN', hero0: 'Blau', hero1: 'Rot', hero2: 'Lila', hero3: 'Orange',
      c1: 'PFEILE / A D - LAUFEN', c2: 'LEERTASTE / W - SPRUNG', c3: 'J-SCHWERT K-SCHILD L-STERN', c4: 'ESC / P - PAUSE',
      levels: 'LEVEL', hud_level: 'LV {0}/40', zone: 'ZONE {0}: {1}', z0: 'WALD', z1: 'BURG', z2: 'VERLIES',
      hint: 'VON A NACH B!',
      done: 'LEVEL {0} GESCHAFFT!', earned: 'Münzen: +{0}', bonus: 'Zielbonus: +{0}', total: 'Münzen gesamt: {0}',
      next: 'Weiter', map: 'Karte', back: 'Zurück',
      shop: 'Upgrades', sk_atk: 'Angriff', sk_def: 'Abwehr', sk_hp: 'Leben', lv: 'St.{0}/{1}', max: 'MAX',
      atk_info: 'Schwert {0} Stern {1}', def_info: 'Schaden -{0}%', hp_info: '{0} LP', nomoney: 'ZU WENIG MÜNZEN',
      bank: 'Bank', pack: '+{0} Münzen', demo: 'DEMO: es wird kein echtes Geld abgebucht.', bought: 'Gekauft: +{0} Münzen',
      ad: 'Werbung +{0}', ad_title: 'WERBUNG', ad_brand: 'PIZZA PALAST', ad_slogan: 'HEISSE PIZZA IN 5 MINUTEN!',
      ad_wait: 'Belohnung in {0}', ad_close: 'Schließen +{0}',
      pause: 'PAUSE', resume: 'Weiter', quit: 'Zur Karte',
      gameover: 'SPIEL VORBEI', retry: 'Nochmal',
      win: 'SIEG!', win_text: 'ALLE 40 LEVEL GESCHAFFT!',
    },
    fr: {
      title1: 'TORTUES', title2: 'NINJA', press: 'APPUYEZ SUR ENTRÉE',
      play: 'Jouer', lang: 'Langue: {0}', sound: 'Son: {0}', on: 'OUI', off: 'NON',
      nosave: 'PROGRESSION NON SAUVEE', age: '12+',
      choose: 'CHOISIS TON HEROS', hero0: 'Bleu', hero1: 'Rouge', hero2: 'Violet', hero3: 'Orange',
      c1: 'FLÈCHES / A D - MARCHER', c2: 'ESPACE / W - SAUT', c3: 'J-ÉPÉE K-BOUCLIER L-ÉTOILE', c4: 'ÉCHAP / P - PAUSE',
      levels: 'NIVEAUX', hud_level: 'NIV {0}/40', zone: 'ZONE {0}: {1}', z0: 'FORÊT', z1: 'CHÂTEAU', z2: 'DONJON',
      hint: 'ATTEINS B DEPUIS A!',
      done: 'NIVEAU {0} REUSSI!', earned: 'Pièces: +{0}', bonus: "Bonus d'arrivée: +{0}", total: 'Total pièces: {0}',
      next: 'Suite', map: 'Carte', back: 'Retour',
      shop: 'Boutique', sk_atk: 'Attaque', sk_def: 'Défense', sk_hp: 'Santé', lv: 'Niv.{0}/{1}', max: 'MAX',
      atk_info: 'Épée {0} Étoile {1}', def_info: 'Dégâts -{0}%', hp_info: '{0} PV', nomoney: 'PAS ASSEZ DE PIECES',
      bank: 'Banque', pack: '+{0} pièces', demo: "DEMO: aucun vrai argent n'est débité.", bought: 'Acheté: +{0} pièces',
      ad: 'Pub +{0}', ad_title: 'PUBLICITÉ', ad_brand: 'PIZZA PALACE', ad_slogan: 'PIZZA CHAUDE EN 5 MINUTES!',
      ad_wait: 'Récompense dans {0}', ad_close: 'Fermer +{0}',
      pause: 'PAUSE', resume: 'Reprendre', quit: 'Vers la carte',
      gameover: 'PARTIE TERMINEE', retry: 'Rejouer',
      win: 'VICTOIRE!', win_text: 'LES 40 NIVEAUX SONT FINIS!',
    },
  };
  const ORDER = ['ru', 'en', 'de', 'fr'];
  let lang = detect();

  function detect() {
    const l = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    return D[l] ? l : 'en';
  }
  function apply() { document.documentElement.lang = lang; }
  apply();

  return {
    get lang() { return lang; },
    set(l) { if (D[l]) { lang = l; apply(); } },
    next() { lang = ORDER[(ORDER.indexOf(lang) + 1) % ORDER.length]; apply(); },
    t(key, ...args) {
      let s = D[lang][key] ?? D.en[key] ?? key;
      args.forEach((v, i) => { s = s.split('{' + i + '}').join(v); });
      return s;
    },
  };
})();
const t = (k, ...a) => I18N.t(k, ...a);
