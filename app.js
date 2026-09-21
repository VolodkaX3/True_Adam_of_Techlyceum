// Посетитель, переключение разделов, статистика, настройки, язык.
const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};
const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
};

// ---------- анонимный id посетителя (для подсчёта онлайна и уникальных) ----------
const VID = store.get("vid") || (() => {
    const v = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    store.set("vid", v);
    return v;
})();

function track(type) {
    if (!statsOn()) return;
    fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type, vid: VID }),
    }).catch(() => {});
}
try {
    if (!sessionStorage.getItem("visited")) { sessionStorage.setItem("visited", "1"); track("visit"); }
} catch (_) { track("visit"); }
track("ping");
setInterval(() => { if (!document.hidden) track("ping"); }, 30000);

// ---------- личная статистика (только в этом браузере) ----------
function saveMe(placed) {
    let me;
    try { me = JSON.parse(store.get("me") || "{}"); } catch (_) { me = {}; }
    me.games = (me.games || 0) + 1;
    me.duels = (me.duels || 0) + duelLog.length;
    me.adam = me.adam || {};
    me.adam[placed[0]] = (me.adam[placed[0]] || 0) + 1;
    store.set("me", JSON.stringify(me));
}

// ---------- разделы ----------
const VIEWS = ["home", "stats", "settings", "about"];
let statsTimer = null;

function showView(name) {
    VIEWS.forEach((v) => ($("view-" + v).hidden = v !== name));
    document.querySelectorAll(".note").forEach((n) => n.classList.toggle("active", n.dataset.view === name));
    clearInterval(statsTimer);
    if (name === "stats") { loadStats(); statsTimer = setInterval(loadStats, 15000); }
    window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("[data-view]").forEach((b) => {
    b.onclick = () => showView(b.classList.contains("active") ? "home" : b.dataset.view);
});

// ---------- статистика ----------
let statsData = null, statsMsg = "";

async function loadStats() {
    if (!statsOn()) { statsMsg = "statsOff"; renderStats(); return; }
    if (!statsData) { statsMsg = "statsLoading"; renderStats(); }
    try {
        const r = await fetch(SHEET_URL);
        if (!r.ok) throw new Error(r.status);
        statsData = await r.json();
        statsMsg = "";
    } catch (e) {
        if (!statsData) statsMsg = "statsErr";
    }
    renderStats();
}

function card(label, value, cls) {
    const c = el("div", "stat" + (cls ? " " + cls : ""));
    c.append(el("b", null, value), el("span", null, label));
    return c;
}

function renderStats() {
    const grid = $("statsGrid"), extra = $("statsExtra");
    grid.replaceChildren();
    extra.replaceChildren();
    $("statsMsg").textContent = statsMsg ? t(statsMsg) : "";
    const d = statsData;
    if (d) {
        [["online", d.online], ["visits", d.visits], ["visitors", d.visitors], ["visitsToday", d.visitsToday],
         ["games", d.games], ["gamesToday", d.gamesToday], ["players", d.players], ["duels", d.duels],
         ["avg", d.games ? (d.duels / d.games).toFixed(1) : "–"]]
            .forEach(([k, v]) => grid.append(card(t("stat_" + k), v ?? 0, k === "online" ? "live" : "")));

        const max = Math.max(1, ...d.days.map((x) => x.v));
        const bars = el("div", "bars");
        d.days.forEach((x) => {
            const col = el("div", "bar-col");
            const bar = el("div", "bar");
            bar.style.height = Math.max(4, Math.round((100 * x.v) / max)) + "%";
            col.append(el("small", null, x.v), bar, el("small", null, x.d));
            bars.append(col);
        });
        extra.append(el("h4", null, t("statsDays")), bars);

        const top = d.teachers.map((r, id) => ({ id, n: r.adam })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
        if (top.length) {
            const ol = el("ol", "toplist");
            top.forEach((x) => ol.append(el("li", null, `${teachers[x.id].short} — ${x.n}`)));
            extra.append(el("h4", null, t("statsTop")), ol);
        }
    }

    // личная статистика
    let me;
    try { me = JSON.parse(store.get("me") || "{}"); } catch (_) { me = {}; }
    extra.append(el("h4", null, t("statsMe")));
    if (!me.games) {
        extra.append(el("p", null, t("meNone")));
    } else {
        const g = el("div", "stats-grid");
        g.append(card(t("meGames"), me.games), card(t("meDuels"), me.duels));
        const best = Object.entries(me.adam || {}).sort((a, b) => b[1] - a[1])[0];
        if (best && teachers[best[0]]) g.append(card(t("meAdam"), teachers[best[0]].short));
        extra.append(g);
    }
}

// ---------- язык ----------
function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = t(e.dataset.i18n)));
    document.querySelectorAll("[data-i18n-label]").forEach((e) => e.setAttribute("data-label", t(e.dataset.i18nLabel)));
    document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    renderGameText();
    renderBoard();
    renderStats();
}
document.querySelectorAll(".lang-btn").forEach((b) => {
    b.onclick = () => { lang = b.dataset.lang; store.set("lang", lang); applyLang(); };
});

// ---------- эффект появления True Adam ----------
const MOG_TEXT = "MOG"; // "кричащее" слово (можно заменить на "МОГ")
let fxRun = 0;

function playAdamFx(tr) {
    const calm = fxMode === "calm"; // упрощённый режим: без вспышек и тряски
    const fx = $("adamFx"), stage = $("adamStage"), words = $("adamWords"), reveal = $("adamReveal");
    const id = ++fxRun;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => id === fxRun && fn(), ms));
    const close = () => { fxRun++; timers.forEach(clearTimeout); fx.hidden = true; };
    const shake = (px) => {
        if (calm) return;
        stage.style.setProperty("--shake", px + "px");
        stage.classList.remove("shake");
        void stage.offsetWidth;
        stage.classList.add("shake");
    };
    words.replaceChildren();
    words.hidden = false;
    reveal.replaceChildren();
    reveal.hidden = true;
    fx.classList.remove("flash");
    fx.hidden = false;
    fx.onclick = close;

    const colors = ["#ffffff", "#ff3b3b", "#ffb84d", "#ffffff"];
    for (let i = 0; i < 4; i++) {
        later(() => {
            const w = el("span", null, MOG_TEXT);
            w.style.color = colors[i];
            w.style.fontSize = 15 + i * 2 + "vmin";
            w.style.rotate = (Math.random() * 6 - 3).toFixed(1) + "deg";
            words.append(w);
            shake(6 + i * 5);
        }, i * 260);
    }
    later(() => {
        words.hidden = true;
        if (!calm) fx.classList.add("flash");
        reveal.append(el("span", "tag", "TRUE ADAM"), photo(tr), el("b", null, tr.name), el("small", null, tr.role));
        reveal.hidden = false;
        shake(14);
        confetti(innerWidth / 2, innerHeight / 2, 70);
    }, 1200);
    later(close, 4500);
}

// ---------- конфетти и вылетающие MOG ----------
const rand = (a, b) => a + Math.random() * (b - a);

function confetti(x, y, n = 36) {
    if (fxMode === "calm") return;
    const colors = ["#ff3b3b", "#ffb84d", "#d90429", "#111111", "#ffffff"];
    for (let i = 0; i < n; i++) {
        const p = el("i", "confetti");
        p.style.left = x + "px";
        p.style.top = y + "px";
        p.style.background = colors[i % colors.length];
        document.body.append(p);
        const ang = Math.random() * Math.PI * 2;
        const d = rand(80, 260);
        p.animate(
            [
                { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
                { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d - 60}px) rotate(${rand(-540, 540)}deg)`, opacity: 1, offset: 0.6 },
                { transform: `translate(${Math.cos(ang) * d * 1.1}px, ${Math.sin(ang) * d + 260}px) rotate(${rand(-720, 720)}deg)`, opacity: 0 },
            ],
            { duration: rand(900, 1500), easing: "cubic-bezier(.2,.8,.4,1)" }
        ).onfinish = () => p.remove();
    }
}

function floatWord(x, y) {
    if (fxMode === "calm") return;
    const w = el("span", "float-mog", MOG_TEXT + "!");
    w.style.left = x + "px";
    w.style.top = y + "px";
    w.style.fontSize = rand(1.3, 2.8) + "rem";
    w.style.color = ["#ff3b3b", "#ffb84d", "#d90429", "#ffffff"][Math.floor(rand(0, 4))];
    document.body.append(w);
    w.animate(
        [
            { transform: `translate(-50%,-50%) rotate(${rand(-20, 20)}deg) scale(0.4)`, opacity: 1 },
            { transform: `translate(-50%,-170px) rotate(${rand(-30, 30)}deg) scale(1.2)`, opacity: 0 },
        ],
        { duration: 900, easing: "cubic-bezier(.1,.8,.3,1)" }
    ).onfinish = () => w.remove();
}

// Наклейка MOG! на листе: жми сколько хочешь
$("sticker").onclick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    floatWord(x, y);
    confetti(x, y, 14);
};

// Конфетти при нажатии "Играть" (до того, как баннер спрячется)
document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("#playBtn");
    if (!b) return;
    const r = b.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 40);
}, true);

// ---------- режим анимаций ----------
let fxMode = store.get("fx") || (matchMedia("(prefers-reduced-motion: reduce)").matches ? "calm" : "full");
function applyFx() {
    document.documentElement.dataset.fx = fxMode;
    document.querySelectorAll(".fx-btn").forEach((b) => b.classList.toggle("active", b.dataset.fx === fxMode));
}
document.querySelectorAll(".fx-btn").forEach((b) => {
    b.onclick = () => { fxMode = b.dataset.fx; store.set("fx", fxMode); applyFx(); };
});
applyFx();

applyLang();