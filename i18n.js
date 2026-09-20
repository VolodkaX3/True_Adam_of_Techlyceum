// Переводы интерфейса. Имена и должности учителей НЕ переводятся (они в game.js).
const I18N = {
    ru: {
        disclaimer: "Сайт создан исключительно в развлекательных целях и для поднятия настроения.",
        disclaimerLabel: "! ВНИМАНИЕ",
        gameTag: "ИГРА №1",
        gameTitle: "Кто кого могает?",
        gameDesc: "Перед тобой два учителя лицея. Выбери, кто кого могает. В конце определится True Adam, а за ним chad, htn, mtn, ltn, sub 5 и все остальные sub 3.",
        play: "Играть", board: "Общий рейтинг", exit: "Выйти", again: "Играть снова", back: "Назад", home: "На главную",
        navStats: "Статистика", navSettings: "Настройки", navAbout: "Об авторе",
        results: "Итоги",
        whoIs: (k) => `Кто ${k}?`,
        choice: (n) => `Выбор №${n}`,
        boardOff: "Общий рейтинг ещё не подключён.",
        boardLoading: "Загрузка...",
        boardErr: "Не удалось загрузить рейтинг. Попробуй позже.",
        boardInfo: (n) => `Сыграно игр: ${n}. Очки: True Adam 6, chad 5, htn 4, mtn 3, ltn 2, sub 5 1.`,
        thTeacher: "Учитель", thScore: "Очки", thDuels: "Побед в дуэлях",
        statsOff: "Статистика ещё не подключена.",
        statsLoading: "Загрузка...",
        statsErr: "Не удалось загрузить статистику.",
        stat_online: "Сейчас онлайн", stat_visits: "Всего заходов", stat_visitors: "Уникальных посетителей",
        stat_visitsToday: "Заходов сегодня", stat_games: "Сыграно игр", stat_gamesToday: "Игр сегодня",
        stat_players: "Игроков", stat_duels: "Сделано выборов", stat_avg: "Выборов за игру",
        statsDays: "Заходы за 7 дней", statsTop: "Чаще всего True Adam", statsMe: "Твоя статистика",
        meGames: "Игр сыграно", meDuels: "Выборов сделано", meAdam: "Твой любимый True Adam",
        meNone: "Сыграй первую игру, и здесь появится твоя статистика.",
        langTitle: "Язык", langNote: "Имена и должности учителей не переводятся.",
        aboutSoon: "Скоро здесь что-то появится.",
    },
    en: {
        disclaimer: "This site was created purely for fun and to lift the mood.",
        disclaimerLabel: "! WARNING",
        gameTag: "GAME #1",
        gameTitle: "Who mogs who?",
        gameDesc: "You get two lyceum teachers. Pick who mogs whom. In the end True Adam is decided, followed by chad, htn, mtn, ltn, sub 5 and everyone else sub 3.",
        play: "Play", board: "Global ranking", exit: "Exit", again: "Play again", back: "Back", home: "Home",
        navStats: "Statistics", navSettings: "Settings", navAbout: "About the author",
        results: "Results",
        whoIs: (k) => `Who is ${k}?`,
        choice: (n) => `Choice #${n}`,
        boardOff: "The global ranking is not connected yet.",
        boardLoading: "Loading...",
        boardErr: "Could not load the ranking. Try again later.",
        boardInfo: (n) => `Games played: ${n}. Points: True Adam 6, chad 5, htn 4, mtn 3, ltn 2, sub 5 1.`,
        thTeacher: "Teacher", thScore: "Points", thDuels: "Duel wins",
        statsOff: "Statistics are not connected yet.",
        statsLoading: "Loading...",
        statsErr: "Could not load statistics.",
        stat_online: "Online now", stat_visits: "Total visits", stat_visitors: "Unique visitors",
        stat_visitsToday: "Visits today", stat_games: "Games played", stat_gamesToday: "Games today",
        stat_players: "Players", stat_duels: "Choices made", stat_avg: "Choices per game",
        statsDays: "Visits in 7 days", statsTop: "Most often True Adam", statsMe: "Your stats",
        meGames: "Games played", meDuels: "Choices made", meAdam: "Your favorite True Adam",
        meNone: "Play your first game and your stats will appear here.",
        langTitle: "Language", langNote: "Teachers' names and positions are not translated.",
        aboutSoon: "Something will appear here soon.",
    },
    uk: {
        disclaimer: "Сайт створено виключно з розважальною метою та для підняття настрою.",
        disclaimerLabel: "! УВАГА",
        gameTag: "ГРА №1",
        gameTitle: "Хто кого могає?",
        gameDesc: "Перед тобою двоє вчителів ліцею. Обери, хто кого могає. Наприкінці визначиться True Adam, а за ним chad, htn, mtn, ltn, sub 5 та всі інші sub 3.",
        play: "Грати", board: "Загальний рейтинг", exit: "Вийти", again: "Грати знову", back: "Назад", home: "На головну",
        navStats: "Статистика", navSettings: "Налаштування", navAbout: "Про автора",
        results: "Підсумки",
        whoIs: (k) => `Хто ${k}?`,
        choice: (n) => `Вибір №${n}`,
        boardOff: "Загальний рейтинг ще не підключено.",
        boardLoading: "Завантаження...",
        boardErr: "Не вдалося завантажити рейтинг. Спробуй пізніше.",
        boardInfo: (n) => `Зіграно ігор: ${n}. Бали: True Adam 6, chad 5, htn 4, mtn 3, ltn 2, sub 5 1.`,
        thTeacher: "Вчитель", thScore: "Бали", thDuels: "Перемог у двобоях",
        statsOff: "Статистику ще не підключено.",
        statsLoading: "Завантаження...",
        statsErr: "Не вдалося завантажити статистику.",
        stat_online: "Зараз онлайн", stat_visits: "Усього заходів", stat_visitors: "Унікальних відвідувачів",
        stat_visitsToday: "Заходів сьогодні", stat_games: "Зіграно ігор", stat_gamesToday: "Ігор сьогодні",
        stat_players: "Гравців", stat_duels: "Зроблено виборів", stat_avg: "Виборів за гру",
        statsDays: "Заходи за 7 днів", statsTop: "Найчастіше True Adam", statsMe: "Твоя статистика",
        meGames: "Ігор зіграно", meDuels: "Виборів зроблено", meAdam: "Твій улюблений True Adam",
        meNone: "Зіграй першу гру, і тут з'явиться твоя статистика.",
        langTitle: "Мова", langNote: "Імена та посади вчителів не перекладаються.",
        aboutSoon: "Скоро тут щось з'явиться.",
    },
};

let lang = (() => {
    try {
        const s = localStorage.getItem("lang");
        if (I18N[s]) return s;
    } catch (_) {}
    const n = (navigator.language || "").slice(0, 2);
    return n === "uk" ? "uk" : n === "en" ? "en" : "ru";
})();

const t = (k, ...a) => {
    const v = I18N[lang][k] ?? I18N.ru[k] ?? k;
    return typeof v === "function" ? v(...a) : v;
};
