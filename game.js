// общий рейтинг через google таблицу
// вставь сюда ссылку на веб-приложение apps script заканчивается на /exec
// пока пусто и игра работает а рейтинг выключен
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwmbeRihb9_9C7aP--4AIeWB7rL6JQKA9cLNewg5uggtuEvaGmGDXfcPk_58THb2w31Vg/exec";


// учителя: файл из папки img, фио, должность
const DATA = [
    ["ilyushina.jpg", "Ілюшина Олена Олександрівна", "Директор ліцею"],
    ["Leshhenko-Nataliya-Sergiyivna-vchitel-biologiyi2.jpg", "Лещенко Наталія Сергіївна", "Заступник директора з навчально-виховної роботи"],
    ["YanaFabrykantova.jpg", "Фабрикантова Яна Олександрівна", "Заступник директора з виховної роботи"],
    ["medv.jpg", "Медведєва Оксана Леонідівна", "Заступник директора з наукової та методичної роботи"],
    ["vchitel_s_nimetskoi.jpg", "Громадська Анастасія Олександрівна", "Вчитель німецької мови"],
    ["ghebulda.jpg", "Жебулда Валентина Миколаївна", "Вчитель української мови та літератури"],
    ["JEJERA.jpg", "Жежера Анастасія Павлівна", "Вчитель української мови та літератури"],
    ["FIZYKA.jpg", "Збужова Любов Романівна", "Вчитель фізики та інформатики"],
    ["Zozulya-Lyubov-Vasilivna-vchitel-ukrayinskoyi-movi-ta-literaturi3.jpg", "Зозуля Любов Василівна", "Вчитель української мови та літератури"],
    ["ishenko1.jpg", "Іщенко Ірина Миколаївна", "Вчитель географії"],
    ["Zinchenko.jpg", "Зінченко Наталія Віталіївна", "Вчитель математики"],
    ["VolodymyrKutovenko.jpg", "Кутовенко Володимир Олексійович", "Вчитель історії"],
    ["kuhar.jpg", "Кухар Світлана Миколаївна", "Вчитель англійської мови"],
    ["Krombet-YUriy-Mikolayovich-kerivnik-gurtka-Vokalniy1.jpg", "Кромбет Юрій Миколайович", "Керівник гуртка «Естрадне мистецтво»"],
    ["Lavrenchuk-Viktoriya-Viktorivna-vchitel-angliyskoyi-movi1.jpg", "Лавренчук Вікторія Вікторівна", "Вчитель англійської мови"],
    ["Murchenko.jpg", "Марченко Оксана Миколаївна", "Вчитель української мови"],
    ["Muhnyk.jpg", "Махник Ірина Євгеніївна", "Вчитель англійської мови"],
    ["mokogruz.jpg", "Мокрогуз Альона Василівна", "Практичний психолог"],
    ["prontenko.jpg", "Пронтенко Олег Семенович", "Вчитель історії"],
    ["Ridzel-Irina-Volodimirivna-vchitel-istoriyi-ta-pravoznavstva1.jpg", "Ридзель Ірина Володимирівна", "Вчитель історії та правознавства"],
    ["Saginashvili-Irina-Georgiyivna-vchitel-matematiki1.jpg", "Сагінашвілі Ірина Георгіївна", "Вчитель математики"],
    ["sytch.jpg", "Сич Тетяна Сергіївна", "Вчитель трудового навчання"],
    ["2skostareva.jpg", "Скостарєва Тетяна Іванівна", "Вчитель біології"],
    ["Sturovoytova.jpg", "Старовойтова Наталія Миколаївна", "Вчитель української мови та літератури"],
    ["charchenko.jpg", "Харченко Оксана Григорівна", "Вчитель фізичного виховання"],
    ["Biblia.jpg", "Шимкевич Галина Василівна", "Бібліотекар"],
    ["SHevchenko-Oksana-Mikolayivna-vchitel-matematiki1.jpg", "Шевченко Оксана Миколаївна", "Вчитель математики"],
    ["SHugayevska-Lyudmila-Volodimirivna-vchitel-informatiki2.jpg", "Шугаєвська Людмила Володимирівна", "Вчитель інформатики"],
    ["2FIZRA.jpg", "Щерецька Галина Леонідівна", ""],
];
const TIERS = ["True Adam", "chad", "htn", "mtn", "ltn", "sub 5"]; // остальные это sub 3


const $ = (id) => document.getElementById(id);
const teachers = DATA.map(([file, name, role], i) => ({
    id: i,
    src: "img/" + file,
    name,
    role,
    short: name.split(" ").slice(0, 2).join(" "), // прізвище і ім'я
}));

let wins, count, resolver, duelLog;

const statsOn = () => !!SHEET_URL;

// отправляем результат игры топ 6 и все сделанные выборы в дуэлях
async function submit(placed) {
    if (!statsOn()) return;
    try {
        await fetch(SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ placed, duels: duelLog, vid: VID }),
        });
    } catch (e) {
        console.warn("Не удалось отправить результат", e);
    }
}

const POINTS = ["adam", "chad", "htn", "mtn", "ltn", "sub5"]; // 6 5 4 3 2 1 очков

let boardData = null, boardMsg = "";
let stageK = null, countN = 0, resultsShown = false, lastPlaced = null;

// тексты которые меняются при смене языка
function renderGameText() {
    $("stage").textContent = stageK === null ? "" : stageK === -1 ? t("results") : t("whoIs", TIERS[stageK]);
    $("count").textContent = countN ? t("choice", countN) : "";
    $("exitBtn").textContent = resultsShown ? t("again") : t("exit");
    // шкала прогресса: сколько мест уже определено из общего числа тиров
    const pct = stageK === null ? 0 : stageK === -1 ? 100 : Math.round((100 * stageK) / TIERS.length);
    $("progressFill").style.width = pct + "%";
    $("progressNum").textContent = pct + "%";
    $("progress").setAttribute("aria-valuenow", pct);
}

async function showBoard() {
    cancelRun();
    $("banner").hidden = true;
    $("arena").hidden = true;
    $("board").hidden = false;
    boardData = null;
    if (!statsOn()) { boardMsg = "boardOff"; renderBoard(); return; }
    boardMsg = "boardLoading";
    renderBoard();
    try {
        const res = await fetch(SHEET_URL);
        if (!res.ok) throw new Error(res.status);
        boardData = await res.json();
        boardMsg = "";
    } catch (e) {
        boardMsg = "boardErr";
    }
    renderBoard();
}

function renderBoard() {
    const info = $("boardInfo");
    const table = $("boardTable");
    table.replaceChildren();
    if (!boardData) { info.textContent = boardMsg ? t(boardMsg) : ""; return; }
    const rows = boardData.teachers.map((r, id) => ({
        ...r,
        teacher: id,
        score: POINTS.reduce((s, k, i) => s + (6 - i) * r[k], 0),
    }));
    rows.sort((a, b) => b.score - a.score || b.adam - a.adam || a.teacher - b.teacher);
    info.textContent = t("boardInfo", boardData.games);
    const head = ["#", t("thTeacher"), "True Adam", "chad", "htn", "mtn", "ltn", "sub 5", "sub 3", t("thScore"), t("thDuels")];
    const thead = table.createTHead().insertRow();
    head.forEach((h) => (thead.appendChild(document.createElement("th")).textContent = h));
    const body = table.createTBody();
    rows.forEach((r, i) => {
        const tr = body.insertRow();
        const duels = r.dw + r.dl ? Math.round((100 * r.dw) / (r.dw + r.dl)) + "%" : "–";
        [i + 1, teachers[r.teacher] ? teachers[r.teacher].short : "?", r.adam, r.chad, r.htn, r.mtn, r.ltn, r.sub5, r.sub3, r.score, duels]
            .forEach((v) => (tr.insertCell().textContent = v));
    });
}

const shuffle = (a) => {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// уже известен результат напрямую или через цепочку побед
function reach(from, to) {
    const seen = new Set([from]);
    const stack = [from];
    while (stack.length) {
        for (const y of wins[stack.pop()]) {
            if (y === to) return true;
            if (!seen.has(y)) { seen.add(y); stack.push(y); }
        }
    }
    return false;
}

function photo(t, cls) {
    const img = new Image();
    img.alt = t.name;
    img.src = t.src;
    img.onerror = () => {
        const ph = document.createElement("div");
        ph.className = "ph";
        ph.textContent = t.id + 1;
        img.replaceWith(ph);
    };
    return img;
}

function fill(el, t) {
    const box = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = t.name;
    const role = document.createElement("small");
    role.textContent = t.role;
    box.append(name, role);
    el.replaceChildren(photo(t), box);
}

let runId = 0;
const cancelRun = () => { runId++; resolver = null; };
const MOG_DELAY = 850; // сколько держим штамп mogged перед следующим выбором в мс

function ask(a, b) {
    return new Promise((resolve) => {
        const flip = Math.random() < 0.5;
        const cA = $("cardA"), cB = $("cardB");
        [cA, cB].forEach((c) => c.classList.remove("mogged", "won"));
        fill(cA, teachers[flip ? b : a]);
        fill(cB, teachers[flip ? a : b]);
        countN = ++count;
        renderGameText();
        const id = runId;
        resolver = (side) => {
            resolver = null; // защита от двойного клика
            const [win, lose] = side > 0 ? [cA, cB] : [cB, cA];
            win.classList.add("won");
            lose.classList.add("mogged"); // проигравший могнут
            setTimeout(() => { if (id === runId) resolve(flip ? -side : side); }, MOG_DELAY); // 1 значит победил a
        };
    });
}

async function duel(a, b) {
    if (reach(a, b)) return a;
    if (reach(b, a)) return b;
    const r = await ask(a, b);
    const [w, l] = r > 0 ? [a, b] : [b, a];
    wins[w].add(l);
    duelLog.push([w, l]);
    return w;
}

async function knockout(list) {
    let round = shuffle(list);
    while (round.length > 1) {
        const next = [];
        for (let i = 0; i + 1 < round.length; i += 2) next.push(await duel(round[i], round[i + 1]));
        if (round.length % 2) next.push(round[round.length - 1]);
        round = next;
    }
    return round[0];
}

async function play() {
    cancelRun();
    $("banner").hidden = true;
    $("arena").hidden = false;
    $("results").hidden = true;
    $("board").hidden = true;
    $("boardBtn2").hidden = true;
    $("certBtn").hidden = true;
    $("duel").hidden = false;
    wins = teachers.map(() => new Set());
    count = 0;
    duelLog = [];
    stageK = 0;
    countN = 0;
    resultsShown = false;
    renderGameText();
    const placed = [];
    for (let k = 0; k < TIERS.length; k++) {
        stageK = k;
        renderGameText();
        // это место мог занять только тот кто проиграл кому то из уже выбранных
        const pool = k === 0
            ? teachers.map((t) => t.id)
            : teachers.map((t) => t.id).filter((c) => !placed.includes(c) && placed.some((p) => wins[p].has(c)));
        placed.push(await knockout(pool));
    }
    showResults(placed);
}

function showResults(placed) {
    const rest = teachers.map((t) => t.id).filter((id) => !placed.includes(id));
    const groups = [...placed.map((id, i) => ({ label: TIERS[i], ids: [id] })), { label: "sub 3", ids: rest }];
    const box = $("results");
    box.replaceChildren();
    groups.forEach((g, i) => {
        const tier = document.createElement("div");
        tier.className = "tier" + (i === 0 ? " top" : "");
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = g.label;
        const thumbs = document.createElement("div");
        thumbs.className = "thumbs";
        g.ids.forEach((id) => {
            const fig = document.createElement("figure");
            fig.className = "thumb";
            const cap = document.createElement("figcaption");
            cap.textContent = teachers[id].short;
            fig.append(photo(teachers[id]), cap);
            thumbs.append(fig);
        });
        tier.append(tag, thumbs);
        box.append(tier);
    });
    $("duel").hidden = true;
    stageK = -1;
    countN = 0;
    resultsShown = true;
    renderGameText();
    box.hidden = false;
    $("boardBtn2").hidden = false;
    $("certBtn").hidden = false;
    lastPlaced = placed;
    saveMe(placed);
    submit(placed);
    playAdamFx(teachers[placed[0]]);
}

$("cardA").onclick = () => resolver && resolver(1);
$("cardB").onclick = () => resolver && resolver(-1);
$("playBtn").onclick = play;
$("exitBtn").onclick = () => {
    cancelRun();
    if (!$("results").hidden) return play();
    $("arena").hidden = true;
    $("banner").hidden = false;
    stageK = null;
    resultsShown = false;
    renderGameText();
};
$("boardBtn").onclick = showBoard;
$("boardBtn2").onclick = showBoard;
$("boardBack").onclick = () => {
    $("board").hidden = true;
    $("arena").hidden = true;
    $("banner").hidden = false;
};