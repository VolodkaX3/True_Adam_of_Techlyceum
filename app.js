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

// Конфетти при нажатии "Играть" (до того, как баннер спрячется)
document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("#playBtn");
    if (!b) return;
    const r = b.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 40);
}, true);

// ---------- стикер: 3 клика по кружку MOG! ----------
const loadImg = (src) => new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
});

const STICKER_EXTS = ["png", "webp", "gif", "jpg", "jpeg"]; // расширение файла simg/Zozula_sticker.*
let stickerPromise = null, stickerEl = null, stickerClicks = 0, stickerLast = 0;

function stickerSrc() {
    if (!stickerPromise) {
        stickerPromise = (async () => {
            for (const ext of STICKER_EXTS) {
                const src = "simg/Zozula_sticker." + ext;
                if (await loadImg(src)) return src;
            }
            return null;
        })();
    }
    return stickerPromise;
}

async function popSticker(fromX, fromY) {
    const src = await stickerSrc();
    if (!src || stickerEl) return;
    const img = new Image();
    img.src = src;
    img.alt = "";
    img.className = "pop-sticker";
    img.style.width = Math.min(340, innerWidth * 0.6) + "px";
    const tx = innerWidth / 2, ty = innerHeight / 2;
    img.style.left = tx + "px";
    img.style.top = ty + "px";
    stickerEl = img;
    document.body.append(img);
    const calm = fxMode === "calm";
    if (!calm) {
        const dx = fromX - tx, dy = fromY - ty; // вылетает из кружка
        img.animate(
            [
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.05) rotate(-50deg)`, opacity: 0 },
                { transform: "translate(-50%, -50%) scale(1.3) rotate(14deg)", opacity: 1, offset: 0.6 },
                { transform: "translate(-50%, -50%) scale(0.94) rotate(-6deg)", opacity: 1, offset: 0.8 },
                { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
            ],
            { duration: 800, easing: "cubic-bezier(.2,.8,.3,1)" }
        );
        setTimeout(() => confetti(tx, ty, 60), 450);
    }
    const out = () => {
        if (stickerEl !== img) return;
        stickerEl = null;
        if (calm) return img.remove();
        img.animate(
            [
                { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                { transform: "translate(-50%, -50%) scale(0) rotate(40deg)", opacity: 0 },
            ],
            { duration: 300, easing: "ease-in", fill: "forwards" }
        ).onfinish = () => img.remove();
    };
    img.onclick = out;
    setTimeout(out, 3200);
}

// Наклейка MOG! на листе: жми сколько хочешь, на каждый 3-й клик вылезает стикер
$("sticker").onclick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    floatWord(x, y);
    confetti(x, y, 14);
    const now = Date.now();
    stickerClicks = now - stickerLast > 3000 ? 1 : stickerClicks + 1; // серия кликов
    stickerLast = now;
    stickerSrc(); // подгружаем заранее
    if (stickerClicks >= 20) {
        stickerClicks = 0;
        popSticker(x, y);
    }
};

// ---------- грамота (картинка с топом) ----------
const AUTHOR = "@Volodka_X3";
const SITE_URL = "volodkax3.github.io/True_Adam_of_Techlyceum";
const CERT_FONT = '"Plus Jakarta Sans", Arial, sans-serif';

function wrapText(c, text, maxW) {
    const lines = [];
    let line = "";
    for (const w of text.split(" ")) {
        const test = line ? line + " " + w : w;
        if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

async function makeCert(placed) {
    const W = 1080, H = 1350, ink = "#111111", F = CERT_FONT;
    try {
        await Promise.all([document.fonts.load(`800 40px ${F}`), document.fonts.load(`600 24px ${F}`)]);
    } catch (_) {}
    const imgs = await Promise.all(placed.map((id) => loadImg(teachers[id].src)));
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");

    const box = (x, y, w, h, fill, sh = 8, lw = 6) => {
        c.fillStyle = ink; c.fillRect(x + sh, y + sh, w, h);
        c.fillStyle = fill; c.fillRect(x, y, w, h);
        c.lineWidth = lw; c.strokeStyle = ink; c.strokeRect(x, y, w, h);
    };
    const text = (s, x, y, size, weight, color, align = "center") => {
        c.font = `${weight} ${size}px ${F}`;
        c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic";
        c.fillText(s, x, y);
    };
    const photo = (i, x, y, w, h) => {
        const img = imgs[i];
        if (img) {
            const r = Math.max(w / img.width, h / img.height);
            const sw = w / r, sh = h / r;
            c.drawImage(img, (img.width - sw) / 2, 0, sw, sh, x, y, w, h); // обрезка сверху, как на сайте
        } else {
            c.fillStyle = "#ffffff"; c.fillRect(x, y, w, h);
            text(String(placed[i] + 1), x + w / 2, y + h / 2 + 20, 60, 800, "#ff3b3b");
        }
        c.lineWidth = 5; c.strokeStyle = ink; c.strokeRect(x, y, w, h);
    };

    // фон-стол в точку
    c.fillStyle = "#fff8ec"; c.fillRect(0, 0, W, H);
    c.fillStyle = ink;
    for (let y = 11; y < H; y += 22) for (let x = 11; x < W; x += 22) c.fillRect(x, y, 2, 2);
    // лист
    box(60, 60, 940, 1200, "#fffdf6", 16, 8);

    // шапка
    c.save(); c.translate(530, 160); c.rotate(-0.026);
    box(-430, -60, 860, 120, "#ff3b3b", 10);
    text(t("certTitle"), 0, 26, 76, 800, "#ffffff");
    c.restore();
    c.save(); c.translate(530, 285); c.rotate(0.017);
    box(-430, -35, 860, 70, "#ffb84d", 8);
    text("TRUE ADAM OF TECHLYCEUM", 0, 12, 34, 800, ink);
    c.restore();
    text(t("certSub"), 530, 372, 30, 600, ink);

    // True Adam
    const a = teachers[placed[0]];
    photo(0, 100, 400, 270, 360);
    c.font = `800 34px ${F}`;
    const tw = c.measureText("TRUE ADAM").width + 40;
    box(400, 410, tw, 56, "#ffb84d", 6, 5);
    text("TRUE ADAM", 400 + tw / 2, 450, 34, 800, ink);
    c.font = `800 46px ${F}`;
    const nameLines = wrapText(c, a.name, 560);
    nameLines.forEach((ln, i) => text(ln, 400, 535 + i * 54, 46, 800, ink, "left"));
    c.font = `600 26px ${F}`;
    wrapText(c, a.role, 560).forEach((ln, i) => text(ln, 400, 535 + nameLines.length * 54 + 10 + i * 32, 26, 600, "#444444", "left"));

    // места 2-6
    for (let i = 1; i < 6; i++) {
        const x = 100 + (i - 1) * 174;
        box(x, 792, 164, 42, "#ffb84d", 5, 4);
        text(TIERS[i], x + 82, 823, 24, 800, ink);
        photo(i, x, 842, 164, 218);
        c.font = `800 21px ${F}`;
        wrapText(c, teachers[placed[i]].short, 164).slice(0, 2).forEach((ln, k) => text(ln, x + 82, 1088 + k * 26, 21, 800, ink));
    }

    // низ: сайт и автор
    text(SITE_URL, 530, 1150, 22, 600, "#444444");
    c.fillStyle = ink; c.fillRect(100, 1168, 860, 72);
    const label = t("certAuthor") + " ";
    c.font = `800 34px ${F}`;
    const w1 = c.measureText(label).width, w2 = c.measureText(AUTHOR).width;
    const sx = 530 - (w1 + w2) / 2;
    text(label, sx, 1215, 34, 800, "#ffffff", "left");
    text(AUTHOR, sx + w1, 1215, 34, 800, "#ffb84d", "left");
    return cv;
}

let certUrl = "";

async function openCert() {
    if (!lastPlaced) return;
    $("certModal").hidden = false;
    $("certShare").hidden = !navigator.share;
    $("certMsg").textContent = "…";
    $("certImg").removeAttribute("src");
    try {
        certUrl = (await makeCert(lastPlaced)).toDataURL("image/png");
        $("certImg").src = certUrl;
        $("certMsg").textContent = "";
    } catch (e) {
        certUrl = "";
        $("certMsg").textContent = t("certErr");
    }
}

$("certBtn").onclick = openCert;
$("certClose").onclick = () => ($("certModal").hidden = true);
$("certModal").onclick = (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("certModal").hidden = true; });

$("certSave").onclick = () => {
    if (!certUrl) return;
    const a = document.createElement("a");
    a.href = certUrl;
    a.download = "true-adam-top.png";
    document.body.append(a);
    a.click();
    a.remove();
};

$("certShare").onclick = async () => {
    if (!certUrl) return;
    const url = "https://" + SITE_URL + "/";
    const text = t("certShareText") + " " + url;
    try {
        const blob = await (await fetch(certUrl)).blob();
        const file = new File([blob], "true-adam-top.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text });
        else await navigator.share({ text, url });
    } catch (e) { /* окно "поделиться" закрыли */ }
};

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