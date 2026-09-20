// ====== УЧИТЕЛЯ ======
// [файл из папки img, ФИО, должность]
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
const TIERS = ["True Adam", "chad", "htn", "mtn", "ltn", "sub 5"]; // остальные — sub 3
// ========================

const $ = (id) => document.getElementById(id);
const teachers = DATA.map(([file, name, role], i) => ({
    id: i,
    src: "img/" + file,
    name,
    role,
    short: name.split(" ").slice(0, 2).join(" "), // Прізвище Ім'я
}));

let wins, count, resolver;

const shuffle = (a) => {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Уже известен результат (напрямую или через цепочку побед)?
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

function ask(a, b) {
    return new Promise((resolve) => {
        const flip = Math.random() < 0.5;
        fill($("cardA"), teachers[flip ? b : a]);
        fill($("cardB"), teachers[flip ? a : b]);
        $("count").textContent = "Выбор №" + ++count;
        resolver = (side) => resolve(flip ? -side : side); // 1 = победил a
    });
}

async function duel(a, b) {
    if (reach(a, b)) return a;
    if (reach(b, a)) return b;
    const r = await ask(a, b);
    const [w, l] = r > 0 ? [a, b] : [b, a];
    wins[w].add(l);
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
    $("banner").hidden = true;
    $("arena").hidden = false;
    $("results").hidden = true;
    $("duel").hidden = false;
    wins = teachers.map(() => new Set());
    count = 0;
    const placed = [];
    for (let k = 0; k < TIERS.length; k++) {
        $("stage").textContent = "Кто " + TIERS[k] + "?";
        // k-е место мог занять только тот, кто проиграл кому-то из уже выбранных
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
    $("stage").textContent = "Итоги";
    $("count").textContent = "";
    $("exitBtn").textContent = "Играть снова";
    box.hidden = false;
}

$("cardA").onclick = () => resolver && resolver(1);
$("cardB").onclick = () => resolver && resolver(-1);
$("playBtn").onclick = play;
$("exitBtn").onclick = () => {
    resolver = null;
    if (!$("results").hidden) { $("exitBtn").textContent = "Выйти"; return play(); }
    $("arena").hidden = true;
    $("banner").hidden = false;
    $("exitBtn").textContent = "Выйти";
};