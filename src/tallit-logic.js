
// Tallit Configurator Logic - Full Integration
// Based on Tallit3D/src/main.js (Last Committed Version)
// Adapted for Scoped Integration with Node.js Backend

const CONFIG = {
    apiBase: '/api'
};

// ---------------- Constants ----------------

const TC_COLORS = [
    // Red
    { name: 'Rouge (CH5116)', hex: '#D70000' },
    { name: 'Brique (C972)', hex: '#CB4154' },
    { name: 'Bourgogne (C978)', hex: '#800020' },
    { name: 'Wine (CH8264)', hex: '#722F37' },
    { name: 'Framboise (CH5193)', hex: '#E30B5C' },

    // Orange
    { name: 'Orange Brulé (CH8265)', hex: '#CC5500' },
    { name: 'Honey (CH5212)', hex: '#EB9605' },
    { name: 'Amber (C995)', hex: '#FFBF00' },

    // Yellow
    { name: 'Gold (C918)', hex: '#FFD700' },
    { name: 'Vieil Or (CH1418)', hex: '#CFB53B' },

    // Green
    { name: 'Lime (CH5139)', hex: '#32CD32' },
    { name: 'Sage (C930)', hex: '#9DC183' },
    { name: 'Cactus (C953)', hex: '#5b6f55' },
    { name: 'Sapin (CH5536)', hex: '#097969' },
    { name: 'Olive foncé (C936)', hex: '#556B2F' },
    { name: 'Forest (C905)', hex: '#0b6623' },

    // Blue
    { name: 'Turquoise (CH1510)', hex: '#40E0D0' },
    { name: 'Jeans (CH4271)', hex: '#5dade2' },
    { name: 'Periwinkle (CH5067)', hex: '#CCCCFF' },
    { name: 'Bleu (CH4272)', hex: '#0000FF' },
    { name: 'Bleu Cobalt (CH4274)', hex: '#0047AB' },
    { name: 'Royal (CH963)', hex: '#2b4f81' },
    { name: 'Peacock (CH4616)', hex: '#007090' },
    { name: 'Marine (CH1425)', hex: '#000080' },

    // Indigo / Violet
    { name: 'Mauve (CH5153)', hex: '#E0B0FF' },
    { name: 'Plum (CH1732)', hex: '#DDA0DD' },
    { name: 'Fuschia (CH5169)', hex: '#FF00FF' },

    // Browns
    { name: 'Chocolat (C964)', hex: '#7B3F00' },

    // Greys / Black (Neutrals)
    { name: 'Stone (CH8115)', hex: '#888c8d' },
    { name: 'Gris foncé (CH271)', hex: '#555555' },
    { name: 'Charcoal (CH4275)', hex: '#36454F' },
    { name: 'Noir (CH83)', hex: '#111111' }
];

const TC_TZITZIT_TYPES = [
    { id: 'none', name: 'No Tzitzit', description: 'Do not attach strings', image: null },
    { id: 'white', name: 'Standard White', description: 'All white strings', image: 'images/ashkenazi.png' },
    { id: 'techelet', name: 'Techelet (Blue)', description: 'White with blue thread', image: 'images/ashkenazi.png' },
    { id: 'ashkenazi', name: 'Ashkenazi Knot', description: '7-8-11-13 windings', image: 'images/ashkenazi.png' },
    { id: 'sephardic', name: 'Sephardic Knot', description: '10-5-6-5 windings', image: 'images/sephardic.png' },
    { id: 'chabad', name: 'Chabad (Ari Zal)', description: 'Chulya groups 3-3-3', image: 'images/chabad.png' },
    { id: 'yemenite', name: 'Yemenite (Rambam)', description: 'Specialized 7-13 chulyot', image: 'images/yemenite.png' },
    { id: 'vilna', name: 'Vilna Gaon', description: 'Gra method 13 windings', image: 'images/vilna.png' }
];

const TC_ATARA_STYLES = [
    { id: 'none', name: 'No Atara', text: '', meaning: '' },
    { id: 'blessing', name: 'The Blessing (L\'hit\'atef)', text: '...אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהִתְעַטֵּף בַּצִּיצִת', meaning: '...Who commanded us to wrap ourselves in Tzitzit' },
    { id: 'shiviti', name: 'Shiviti Hashem', text: 'שִׁוִּיתִי יְהוָה לְנֶגְדִּי תָמִיד', meaning: 'I have set the Lord always before me (Psalm 16:8)' },
    { id: 'etz_chaim', name: 'Etz Chaim (Tree of Life)', text: 'עֵץ־חַיִּים הִיא לַמַּחֲזִיקִים בָּהּ', meaning: 'It is a Tree of Life to those who hold fast to it (Proverbs 3:18)' },
    { id: 'jerusalem', name: 'Jerusalem Skyline', text: 'אִם־אֶשְׁכָּחֵךְ יְרוּשָׁלָ‍ִם', meaning: 'If I forget thee, O Jerusalem... (Psalm 137:5)' }
];

// ---------------- State ----------------

// Fixed Base Color (Not in Stripe Palette)
const TC_BASE_COLOR = { name: 'Blanchi (CH101)', hex: '#F5F5F3' };

let tcState = {
    // Integration State
    userId: null,
    userName: null,

    // App State
    baseColor: TC_BASE_COLOR, // Fixed White
    stripePattern: [],
    activeStripeId: null,
    tzitzitType: TC_TZITZIT_TYPES[0],
    ataraStyle: TC_ATARA_STYLES[0], // Default to No Atara
    isBackView: false
};

// ---------------- DOM Elements ----------------
let tcCanvas, tcCtx, tcZoneUsage, tcStripeStack, tcColorPicker, tcAtaraSelector, tcTzitzitSelector, tcDesignSummary;

// ---------------- Initialization ----------------

export function initTallitConfigurator() {
    try {
        console.log("Initializing Tallit Configurator (Integration Mode v2.1)...");

        // Bind DOM
        tcCanvas = document.getElementById('tc-canvas');
        if (!tcCanvas) throw new Error('Canvas element #tc-canvas not found');
        tcCtx = tcCanvas.getContext('2d');

        // --- High-DPI Setup ---
        const dpr = window.devicePixelRatio || 1;
        // Logical size (CSS pixels)
        const rect = tcCanvas.getBoundingClientRect();

        // If canvas has no intrinsic size yet, force defaults
        const logicalWidth = 800;
        const logicalHeight = 600;

        // Set PHYSICAL dimensions (scaled)
        tcCanvas.width = logicalWidth * dpr;
        tcCanvas.height = logicalHeight * dpr;

        // Force CSS dimensions (logical)
        tcCanvas.style.width = logicalWidth + 'px';
        tcCanvas.style.height = logicalHeight + 'px';

        // Scale Context to match
        tcCtx.scale(dpr, dpr);

        // Store logical width/height for renderers to use
        tcCanvas._logicalWidth = logicalWidth;
        tcCanvas._logicalHeight = logicalHeight;
        // -----------------------

        tcZoneUsage = document.getElementById('tc-zoneUsage');
        tcStripeStack = document.getElementById('tc-stripeStack');
        tcColorPicker = document.getElementById('tc-stripeColorPicker');
        tcAtaraSelector = document.getElementById('tc-ataraSelector');
        // tcTzitzitSelector was removed from DOM, skipping bind
        tcDesignSummary = document.getElementById('tc-designSummary');

        console.log('DOM Bound. Context:', !!tcCtx);

        // Initial Render (Prioritize Visuals)
        console.log('Rendering Canvas...');
        renderTCCanvas();

        console.log('Rendering Controls...');
        renderTCControls();

        console.log('Updating Summary...');
        updateTCSummary();

        // Attach Listeners & Tooltips
        if (typeof createNameTooltip === 'function') createNameTooltip();

        // Restore scroll listener safely
        if (typeof handleScrollForTooltip === 'function') {
            window.addEventListener('scroll', handleScrollForTooltip);
        }

        if (typeof attachIntegrationListeners === 'function') {
            attachIntegrationListeners();
        } else {
            console.warn('attachIntegrationListeners not found');
        }

        // Initialize Mobile Step (Hides instructions etc)
        updateMobileStep('stripes');

        console.log('Tallit Configurator Init Complete');
    } catch (e) {
        console.error("CRITICAL INIT ERROR:", e);
    }
}

// ---------------- Rendering Logic (Full Fidelity) ----------------

function renderTCCanvas() {
    if (!tcCanvas) tcCanvas = document.getElementById('tc-canvas');
    if (!tcCanvas) return; // Guard clause
    if (!tcCtx) tcCtx = tcCanvas.getContext('2d');

    if (!tcCtx) tcCtx = tcCanvas.getContext('2d');

    // Use stored logical dimensions or fallback
    const w = tcCanvas._logicalWidth || 800;
    const h = tcCanvas._logicalHeight || 600;

    // Clear
    tcCtx.clearRect(0, 0, w, h);

    const padding = 50;
    const tWidth = w - (padding * 2);
    const tHeight = h - (padding * 2);
    const startX = padding;
    const startY = padding;

    if (tWidth <= 0 || tHeight <= 0) return;

    // 1. Draw Tallit Base
    const baseHex = (tcState.baseColor && tcState.baseColor.hex) ? tcState.baseColor.hex : '#FFFFFF';

    tcCtx.save();
    tcCtx.fillStyle = baseHex;
    tcCtx.fillStyle = baseHex;
    // Mobile optimization: Reduce shadow complexity
    // tcCtx.shadowColor = 'rgba(0,0,0,0.3)';
    // tcCtx.shadowBlur = 20; 
    tcCtx.fillRect(startX, startY, tWidth, tHeight);
    tcCtx.restore();

    // 1b. Texture
    drawTexture(startX, startY, tWidth, tHeight);

    // 2. Draw Stripes
    drawStripePattern(startX, startY, tWidth, tHeight);

    // 3/4. Front vs Back Features
    if (!tcState.isBackView) {
        // FRONT VIEW
        drawAtara(startX, startY, tWidth);
        drawTzitzitColors(startX, startY, tWidth, tHeight);
    } else {
        // BACK VIEW
        drawKanafim(startX, startY, tWidth, tHeight);
    }

    // 5. Draw Fringes (Side twisted strands)
    drawFringes(startX, startY, tWidth, tHeight);
}

// --- Drawing Helpers ---

function drawTexture(x, y, w, h) {
    tcCtx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let i = 0; i < w; i += 2) tcCtx.fillRect(x + i, y, 1, h);
    for (let j = 0; j < h; j += 2) tcCtx.fillRect(x, y + j, w, 1);
}

function drawStripePattern(x, y, w, h) {
    const TALLIT_LENGTH = 60;
    const STRIPE_START_OFFSET = 5;
    const ppi = w / TALLIT_LENGTH;

    const startPixelLeft = x + (STRIPE_START_OFFSET * ppi);
    const startPixelRight = x + w - (STRIPE_START_OFFSET * ppi);

    // Left Side
    let currentPos = startPixelLeft;
    tcState.stripePattern.forEach(item => {
        const widthPx = item.width * ppi;
        if (item.type === 'stripe') {
            tcCtx.fillStyle = item.color.hex;
            tcCtx.fillRect(currentPos, y, widthPx, h);
        }
        currentPos += widthPx;
    });

    // Right Side (Mirrored)
    let currentPosRight = startPixelRight;
    tcState.stripePattern.forEach(item => {
        const widthPx = item.width * ppi;
        currentPosRight -= widthPx;
        if (item.type === 'stripe') {
            tcCtx.fillStyle = item.color.hex;
            tcCtx.fillRect(currentPosRight, y, widthPx, h);
        }
    });
}

function drawAtara(x, y, w) {
    if (tcState.ataraStyle.id === 'none') return;

    const ataraWidth = w * 0.4;
    const ataraHeight = 40;
    const ataraX = x + (w / 2) - (ataraWidth / 2);
    const style = tcState.ataraStyle;

    // Geometry
    const ptSize = 15;

    tcCtx.beginPath();
    tcCtx.moveTo(ataraX, y + ataraHeight / 2);
    tcCtx.lineTo(ataraX + ptSize, y);
    tcCtx.lineTo(ataraX + ataraWidth - ptSize, y);
    tcCtx.lineTo(ataraX + ataraWidth, y + ataraHeight / 2);
    tcCtx.lineTo(ataraX + ataraWidth - ptSize, y + ataraHeight);
    tcCtx.lineTo(ataraX + ptSize, y + ataraHeight);
    tcCtx.closePath();

    tcCtx.fillStyle = '#F8F9FA';
    tcCtx.fill();
    tcCtx.strokeStyle = '#B0B0B0';
    tcCtx.lineWidth = 2;
    tcCtx.stroke();

    if (style.id === 'jerusalem') {
        drawJerusalemSkyline(ataraX, y, ataraWidth, ataraHeight);
    }

    if (style.text) {
        tcCtx.save();
        tcCtx.fillStyle = '#222';
        tcCtx.font = 'bold 16px serif';
        tcCtx.textAlign = 'center';
        tcCtx.textBaseline = 'middle';
        tcCtx.fillText(style.text, ataraX + ataraWidth / 2, y + ataraHeight / 2);
        tcCtx.restore();
    }
}

function drawJerusalemSkyline(x, y, w, h) {
    tcCtx.save();
    tcCtx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    tcCtx.beginPath();
    tcCtx.moveTo(x, y + h);
    const steps = 20;
    const stepW = w / steps;
    for (let i = 0; i <= steps; i++) {
        const px = x + (i * stepW);
        const ph = (Math.sin(i * 1.5) + 1) * (h * 0.3) + 5;
        tcCtx.lineTo(px, y + h - ph);
    }
    tcCtx.lineTo(x + w, y + h);
    tcCtx.closePath();
    tcCtx.fill();
    tcCtx.restore();
}

// ---------------- Fringes (Edges) ----------------

function drawFringes(x, y, w, h) {
    const FRINGE_LENGTH_INCHES = 3;
    const FRINGE_SPACING_INCHES = 1;
    const CORNER_OFFSET_INCHES = 4.5;
    const TALLIT_HEIGHT_INCHES = 45;
    const ppi = h / TALLIT_HEIGHT_INCHES;

    const fringeLenPx = FRINGE_LENGTH_INCHES * ppi;
    const offsetPx = CORNER_OFFSET_INCHES * ppi;
    const spacingPx = FRINGE_SPACING_INCHES * ppi;

    const startFringeY = y + offsetPx;
    const endFringeY = y + h - offsetPx;

    function drawTwistedStrand(sx, sy, ex, ey) {
        // Shadow
        tcCtx.beginPath(); tcCtx.moveTo(sx, sy); tcCtx.lineTo(ex, ey);
        tcCtx.strokeStyle = '#000000'; tcCtx.lineWidth = 5; tcCtx.stroke();

        // Body
        tcCtx.beginPath(); tcCtx.moveTo(sx, sy); tcCtx.lineTo(ex, ey);
        tcCtx.strokeStyle = '#FFFFFF'; tcCtx.lineWidth = 3; tcCtx.stroke();

        // Texture
        const dx = ex - sx; const dy = ey - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const twistSpacing = 10;

        tcCtx.save();
        tcCtx.translate(sx, sy);
        tcCtx.rotate(angle);
        tcCtx.beginPath(); tcCtx.strokeStyle = '#000000'; tcCtx.lineWidth = 1;

        for (let i = 2; i < len - 2; i += twistSpacing) {
            tcCtx.moveTo(i, -1.5); tcCtx.lineTo(i + 2, 1.5);
        }
        tcCtx.stroke();
        tcCtx.restore();
    }

    for (let fy = startFringeY; fy <= endFringeY; fy += spacingPx) {
        drawTwistedStrand(x, fy, x - fringeLenPx, fy); // Left
        drawTwistedStrand(x + w, fy, x + w + fringeLenPx, fy); // Right
    }
}

// ---------------- Tzitzit (Corners) ----------------

function drawTzitzitColors(x, y, w, h) {
    const stringColor = tcState.tzitzitType.id === 'techelet' ? '#1a4a8a' : '#EFEFEF';
    const secondaryColor = '#EFEFEF';

    const corners = [
        { x: x + 10, y: y + h - 10 },
        { x: x + w - 10, y: y + h - 10 },
        { x: x + 10, y: y + 10 },
        { x: x + w - 10, y: y + 10 }
    ];

    corners.forEach(corner => {
        // Draw Hole Area
        tcCtx.beginPath();
        tcCtx.strokeStyle = '#ddd';
        tcCtx.arc(corner.x, corner.y, 4, 0, 2 * Math.PI);
        tcCtx.stroke();
        tcCtx.fillStyle = '#111'; tcCtx.fill();

        // Now delegating to the specialized drawers even in front view for fidelity
        // Map to specific drawing functions (re-using logic from Back View but positioned at corner)
        drawSingleTzitzitDetailed(corner.x, corner.y);
    });
}

function drawSingleTzitzitDetailed(x, y) {
    const id = tcState.tzitzitType.id;
    if (id === 'none') return;

    // Route to logic
    if (id === 'ashkenazi') drawAshkenaziTzitzit(x, y);
    else if (id === 'sephardic') drawSephardicTzitzit(x, y);
    else if (id === 'techelet') drawAshkenaziTzitzit(x, y, true);
    else if (id === 'chabad') drawChabadTzitzit(x, y);
    else if (id === 'yemenite') drawYemeniteTzitzit(x, y);
    else if (id === 'vilna') drawAshkenaziTzitzit(x, y); // Vilna approx
    else drawAshkenaziTzitzit(x, y); // standard
}

function drawKanafim(x, y, w, h) {
    const TALLIT_HEIGHT_INCHES = 45;
    const ppi = h / TALLIT_HEIGHT_INCHES;
    const KANAF_SIZE_INCHES = 4.5;
    const size = KANAF_SIZE_INCHES * ppi;

    const corners = [
        { x: x, y: y },
        { x: x + w - size, y: y },
        { x: x, y: y + h - size },
        { x: x + w - size, y: y + h - size }
    ];

    corners.forEach(corner => {
        // Patch
        tcCtx.fillStyle = '#FFFFFF'; tcCtx.shadowColor = 'rgba(0,0,0,0.1)'; tcCtx.shadowBlur = 5;
        tcCtx.fillRect(corner.x, corner.y, size, size);
        tcCtx.shadowBlur = 0;
        tcCtx.strokeStyle = '#E0E0E0'; tcCtx.strokeRect(corner.x, corner.y, size, size);

        // Holes
        const offset1 = 20; const offset2 = 45;
        let px = (corner.x === x) ? x + offset1 : x + w - offset1;
        let py = (corner.y === y) ? y + offset1 : y + h - offset1;
        let px2 = (corner.x === x) ? x + offset2 : x + w - offset2;
        let py2 = (corner.y === y) ? y + offset1 : y + h - offset1;

        // Draw Holes
        [px, px2].forEach((hX, i) => {
            const hY = (i === 0) ? py : py2;
            tcCtx.beginPath(); tcCtx.arc(hX, hY, 4, 0, 2 * Math.PI);
            tcCtx.fillStyle = '#333'; tcCtx.fill();
        });

        // Draw Tzitzit from holes (Back Viwe)
        drawTzitzitFromHoles(px, py, px2, py2);
    });
}

function drawTzitzitFromHoles(x, y, x2, y2) {
    // Bridge
    tcCtx.beginPath(); tcCtx.strokeStyle = '#DDD'; tcCtx.lineWidth = 2;
    tcCtx.moveTo(x, y); tcCtx.lineTo(x2, y2); tcCtx.stroke();

    // Hanging part uses same logic
    drawSingleTzitzitDetailed(x, y);
}


// --- Knot Drawers ---

function drawAshkenaziTzitzit(x, y, hasBlue = false) {
    const knotSize = 4;
    let currentY = y;
    const mainColor = '#FDFDFD';
    const blueColor = '#1a4a8a';

    drawLooseStrings(x, y + 45, 80, hasBlue);

    const pattern = [7, 8, 11, 13];
    drawKnot(x, currentY, knotSize, mainColor); currentY += knotSize;

    pattern.forEach((count, idx) => {
        const h = count * 0.8;
        if (hasBlue) {
            tcCtx.fillStyle = (idx % 2 !== 0) ? blueColor : mainColor;
            tcCtx.fillRect(x - 2, currentY, 4, h);
        } else {
            tcCtx.fillStyle = mainColor; tcCtx.fillRect(x - 2, currentY, 4, h);
            tcCtx.strokeStyle = '#E0E0E0'; tcCtx.lineWidth = 0.5;
            for (let w = 0; w < h; w += 2) { tcCtx.beginPath(); tcCtx.moveTo(x - 2, currentY + w); tcCtx.lineTo(x + 2, currentY + w); tcCtx.stroke(); }
        }
        currentY += h;
        drawKnot(x, currentY, knotSize, mainColor); currentY += knotSize;
    });
}

function drawSephardicTzitzit(x, y) {
    drawLooseStrings(x, y + 40, 80, false);
    let currentY = y; const knotSize = 4;
    const pattern = [10, 5, 6, 5];
    drawKnot(x, currentY, knotSize, '#FFF'); currentY += knotSize;

    pattern.forEach(count => {
        const h = count * 0.8;
        tcCtx.fillStyle = '#FFF'; tcCtx.fillRect(x - 2, currentY, 4, h);
        tcCtx.strokeStyle = '#DDD'; tcCtx.lineWidth = 1;
        for (let w = 0; w < h; w += 3) { tcCtx.beginPath(); tcCtx.moveTo(x - 2, currentY + w); tcCtx.lineTo(x + 2, currentY + w + 2); tcCtx.stroke(); }
        currentY += h;
        drawKnot(x, currentY, knotSize, '#FFF'); currentY += knotSize;
    });
}

function drawChabadTzitzit(x, y) {
    drawLooseStrings(x, y + 40, 80, false);
    let currentY = y; const knotSize = 4;
    drawKnot(x, currentY, knotSize, '#FFF'); currentY += knotSize;
    for (let i = 0; i < 4; i++) {
        const h = 15;
        tcCtx.fillStyle = '#FFF'; tcCtx.fillRect(x - 2, currentY, 4, h);
        tcCtx.strokeStyle = '#CCC';
        for (let k = 1; k < 3; k++) { let ly = currentY + (h * (k / 3)); tcCtx.beginPath(); tcCtx.moveTo(x - 2, ly); tcCtx.lineTo(x + 2, ly); tcCtx.stroke(); }
        currentY += h;
        drawKnot(x, currentY, knotSize, '#FFF'); currentY += knotSize;
    }
}

function drawYemeniteTzitzit(x, y) {
    drawLooseStrings(x, y + 50, 70, false);
    let currentY = y;
    for (let i = 0; i < 7; i++) {
        tcCtx.fillStyle = '#FFF'; tcCtx.fillRect(x - 3, currentY, 6, 6);
        tcCtx.strokeStyle = '#BBB'; tcCtx.strokeRect(x - 3, currentY, 6, 6);
        currentY += 8;
    }
}

function drawKnot(x, y, size, color) {
    tcCtx.fillStyle = color; tcCtx.beginPath();
    tcCtx.arc(x, y + size / 2, size / 1.5, 0, Math.PI * 2);
    tcCtx.fill(); tcCtx.strokeStyle = '#CCC'; tcCtx.stroke();
}

function drawLooseStrings(x, y, length, hasBlue) {
    const spread = 8;
    const stringColor = '#F0F0F0'; const blueString = '#1a4a8a';
    for (let i = 0; i < 8; i++) {
        tcCtx.beginPath();
        const isBlue = hasBlue && (i === 0 || i === 7);
        tcCtx.strokeStyle = isBlue ? blueString : stringColor;
        tcCtx.lineWidth = 1.5;
        const randomOffset = (Math.random() - 0.5) * 5;
        const endX = x + (i - 3.5) * spread * 0.5 + randomOffset;
        tcCtx.moveTo(x, y);
        tcCtx.bezierCurveTo(x, y + length / 2, endX, y + length * 0.8, endX, y + length);
        tcCtx.stroke();
    }
}

// ---------------- UI & Controls ----------------

function renderTCControls() {
    // 1. Stripes
    if (tcState.stripePattern.length === 0) {
        tcStripeStack.innerHTML = '<div class="empty-state">No stripes added yet.</div>';
    } else {
        tcStripeStack.innerHTML = tcState.stripePattern.map(item =>
            '<div class="stripe-item ' + (item.id === tcState.activeStripeId ? 'active' : '') + '" ' +
            'data-id="' + item.id + '" ' +
            'tabindex="0" ' +
            'role="button" ' +
            'aria-label="Select Stripe ' + item.width + ' inch">' +
            '<div style="display: flex; align-items: center; gap: 10px;">' +
            '<span>' + item.width + '" ' + item.type + '</span>' +
            (item.type === 'stripe' ?
                '<div style="width: 16px; height: 16px; border-radius: 50%; background: ' + item.color.hex + '; border: 1px solid #999;" title="' + item.color.name + '"></div>'
                : '') +
            '</div>' +
            '<div class="delete-btn" data-delete-id="' + item.id + '" title="Delete Stripe" tabindex="0" role="button">✕</div>' +
            '</div>'
        ).join('');
    }

    // 2. Zone Usage
    const usage = tcState.stripePattern.reduce((acc, i) => acc + i.width, 0);
    tcZoneUsage.innerText = `${usage.toFixed(2)}" / 12"`;

    // 3. Colors
    tcColorPicker.innerHTML = TC_COLORS.map(c => `
        <div class="color-swatch" style="background:${c.hex}" data-name="${c.name}"></div>
    `).join('');

    // 4. Atara (Horizontal Cards) - REPLACES previous List
    if (tcAtaraSelector) {
        tcAtaraSelector.innerHTML = TC_ATARA_STYLES.map(s => `
            <div class="tzitzit-card ${tcState.ataraStyle.id === s.id ? 'selected' : ''}" 
                 data-id="${s.id}"
                 role="button"
                 tabindex="0"
                 style="min-width: 220px;">
                <div class="tz-image" style="display:flex; align-items:center; justify-content:center; height:80px; margin-bottom:0.5rem; background:#f5f5f5; border-radius:4px;">
                     <span style="font-family:serif; font-size:1.4rem; color:${s.text ? '#000' : '#ccc'}; direction:${s.text ? 'rtl' : 'ltr'}; padding:0.5rem;">${s.text || 'No Atara'}</span>
                </div>
                <h4>${s.name}</h4>
                <p style="font-size:0.75rem; color:#666;">${s.meaning}</p>
            </div>
        `).join('');
    }

    // 5. Tzitzit Gallery (Horizontal)
    const tzGallery = document.getElementById('tc-tzitzitGallery');
    if (tzGallery) {
        tzGallery.innerHTML = TC_TZITZIT_TYPES.map(t => {
            // Handle image logic - use placeholder if null
            const hasImg = t.image && t.image.length > 5;
            // For 'None', maybe no image or a 'X' icon?
            // Use specific images found: public/images/ashkenazi.png etc. 
            // t.image is like '/images/ashkenazi.png'

            return `
            <div class="tzitzit-card ${tcState.tzitzitType.id === t.id ? 'selected' : ''}" 
                 data-id="${t.id}"
                 role="button"
                 tabindex="0">
                <div class="tz-image">
                    ${hasImg ?
                    `<img src="${t.image}" alt="${t.id}" loading="lazy" 
                              style="cursor: default;">`
                    : `<div style="height:120px; display:flex; align-items:center; justify-content:center; background:#f5f5f5; border-radius:4px; color:#999; font-style:italic;">${t.name}</div>`}
                </div>
                <h4>${t.name}</h4>
                <p>${t.description}</p>
            </div>
            `;
        }).join('');
    }

    updateBuilderVisibility();
    reattachControlListeners();



    // Walkthrough: Continue Hint on second stripe (Disabled for now)
    /*
    if (tcState.stripePattern.length === 2 && !tcState.hasShownContinueHint) {
        setTimeout(() => {
            showContinuePrompt();
            tcState.hasShownContinueHint = true;
        }, 100);
    }
    */
}

function updateBuilderVisibility() {
    const rowStripes = document.getElementById('row-stripes');
    const rowSpaces = document.getElementById('row-spaces');
    const doneBtn = document.getElementById('btn-done-selecting');

    if (!rowStripes || !rowSpaces) return;

    const lastItem = tcState.stripePattern.length > 0 ? tcState.stripePattern[tcState.stripePattern.length - 1] : null;
    const colorPrompt = document.getElementById('tc-colorPrompt');
    const colorPickerContainer = document.getElementById('tc-stripeColorPicker')?.parentElement;

    // Logic: 
    // - Force Color Pick Mode
    if (tcState.pickingColor) {
        rowStripes.style.display = 'none';
        rowSpaces.style.display = 'none';

        if (colorPrompt) {
            colorPrompt.innerText = "Pick Color for this Stripe";
            colorPrompt.style.color = "#d4af37";
            colorPrompt.style.fontWeight = "bold";
        }
        if (colorPickerContainer) {
            colorPickerContainer.style.border = "1px solid #d4af37";
            colorPickerContainer.style.borderRadius = "8px";
            colorPickerContainer.style.padding = "10px";
            colorPickerContainer.style.background = "rgba(212, 175, 55, 0.1)";
        }

    } else {
        // Normal Flow
        if (colorPrompt) {
            colorPrompt.innerText = "Select Stripe Color:";
            colorPrompt.style.color = "";
            colorPrompt.style.fontWeight = "normal";
        }
        if (colorPickerContainer) {
            colorPickerContainer.style.border = "none";
            colorPickerContainer.style.background = "transparent";
            colorPickerContainer.style.padding = "0";
        }

        if (!lastItem) {
            // No items yet: Show Stripes, Hide Spaces
            rowStripes.style.display = 'flex';
            rowStripes.style.opacity = '1';
            rowStripes.style.pointerEvents = 'auto';

            rowSpaces.style.display = 'none';
            rowSpaces.style.opacity = '0';
            rowSpaces.style.pointerEvents = 'none';

        } else if (lastItem.type === 'stripe') {
            // Last was stripe (and color picked): HIDE Stripes, SHOW Spaces
            rowStripes.style.display = 'none';
            rowStripes.style.pointerEvents = 'none';

            rowSpaces.style.display = 'flex';
            rowSpaces.style.opacity = '1';
            rowSpaces.style.pointerEvents = 'auto';

        } else { // Last was space
            // Last was space: SHOW Stripes, HIDE Spaces
            rowStripes.style.display = 'flex';
            rowStripes.style.opacity = '1';
            rowStripes.style.pointerEvents = 'auto';

            rowSpaces.style.display = 'none';
            rowSpaces.style.opacity = '0';
            rowSpaces.style.pointerEvents = 'none';
        }
    }

    // Done Button State
    let isPatternValid = !tcState.pickingColor && lastItem && lastItem.type === 'stripe';
    if (tcState.pickingColor) isPatternValid = false; // Cannot be done while picking color

    if (doneBtn) {
        if (isPatternValid) {
            doneBtn.disabled = false;
            doneBtn.style.opacity = '1';
            doneBtn.style.pointerEvents = 'auto';
            doneBtn.style.cursor = 'pointer';
            doneBtn.style.borderColor = '#d4af37';
            doneBtn.style.color = '#d4af37';
        } else {
            doneBtn.disabled = true;
            doneBtn.style.opacity = '0.3';
            doneBtn.style.pointerEvents = 'none';
            doneBtn.style.cursor = 'not-allowed';
            doneBtn.style.borderColor = '#666';
            doneBtn.style.color = '#666';
        }

        // Listener (Attach once ideally, or re-attach safely)
        // Listener
        doneBtn.onclick = () => {
            const finalItem = tcState.stripePattern.length > 0 ? tcState.stripePattern[tcState.stripePattern.length - 1] : null;
            if (finalItem && finalItem.type === 'stripe') {
                const continuePrompt = document.getElementById('stripeContinuePrompt');
                if (continuePrompt) continuePrompt.remove();

                // Reveal next sections: Tzitzit (Step 3), Atara (Step 4), Save, Instructions
                // Reveal next sections: Tzitzit (Step 3), Atara (Step 4), Save
                ['tzitzit-selection-area', 'atara-selection-area', 'final-options-area'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.style.display = 'block';
                        // Simple fade in
                        el.style.opacity = '0';
                        el.style.transition = 'opacity 0.6s ease';
                        setTimeout(() => el.style.opacity = '1', 10);
                    }
                });

                // Scroll user to the next step (Tzitzit Horizontal)
                setTimeout(() => {
                    document.getElementById('tzitzit-selection-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        };
    }
}

function calculateTCWeavingPattern() {
    const TALLIT_WIDTH_INCHES = 60;
    const TALLIT_HEIGHT_INCHES = 45;

    const totalStripesWidth = tcState.stripePattern.reduce((acc, item) => acc + item.width, 0);

    let totalThreads = 0;
    tcState.stripePattern.forEach(item => {
        // 1 thread = 3/8" / 4 = 0.09375" (approx logic from main.js)
        const t = item.threads || Math.round(item.width / 0.09375);
        totalThreads += t;
    });

    return {
        width: TALLIT_WIDTH_INCHES,
        height: TALLIT_HEIGHT_INCHES,
        totalPatternWidth: totalStripesWidth.toFixed(2),
        threadCount: `${totalThreads} Threads`
    };
}

function getTCThreadCountsByColor() {
    const colorCounts = new Map();
    tcState.stripePattern.forEach(item => {
        if (item.type === 'stripe') {
            const colorName = item.color.name;
            const t = item.threads || Math.round(item.width / 0.09375);

            if (!colorCounts.has(colorName)) {
                colorCounts.set(colorName, { color: item.color, count: 0 });
            }
            colorCounts.get(colorName).count += t;
        }
    });
    return Array.from(colorCounts.values());
}

function updateTCSummary() {
    if (!tcDesignSummary) return;

    const weavingData = calculateTCWeavingPattern();
    const threadCounts = getTCThreadCountsByColor();

    let colorsHtml = '';
    if (threadCounts.length > 0) {
        colorsHtml = `
        <div style="margin-top: 0.5rem;">
          <strong>Thread Counts by Color:</strong>
          <div style="margin-top: 0.3rem; display: flex; flex-direction: column; gap: 0.3rem;">
            ${threadCounts.map(item => `
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="width: 14px; height: 14px; background-color: ${item.color.hex}; border: 1px solid #666; border-radius: 50%;"></div>
                <small style="opacity: 0.9;">${item.color.name} — <strong>${item.count} Threads</strong></small>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
        colorsHtml = `<small style="opacity: 0.5; display: block; margin-top: 0.5rem;">No stripes added yet.</small>`;
    }

    tcDesignSummary.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
              <strong>Base:</strong> ${tcState.baseColor.name} <br>
              <strong>Style:</strong> ${tcState.tzitzitType.name} <br>
              <strong>Atara:</strong> ${tcState.ataraStyle.name} <br>
              ${tcState.ataraStyle.id !== 'none' ? `<small style="opacity: 0.7; font-style: italic;">${tcState.ataraStyle.meaning}</small><br>` : ''}
              
              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.5rem 0;">
              <strong>Proportions:</strong> <br>
              <small>Landscape (${weavingData.width}" x ${weavingData.height}")</small><br>
              <small>Pattern Width: ${weavingData.totalPatternWidth}"</small><br>
            </div>
            <div>
               ${colorsHtml}
               <div style="margin-top: 1rem;">
                  <strong>Total Threads:</strong> <br>
                  <small>${weavingData.threadCount}</small>
               </div>
            </div>
          </div>
      `;
}

function reattachControlListeners() {
    // Stripe Selection
    document.querySelectorAll('#tc-stripeStack .stripe-item').forEach(el => {
        const handler = (e) => {
            // Ignore if clicking the delete button explicitly
            if (e.target.classList.contains('delete-btn')) return;
            tcState.activeStripeId = parseFloat(el.dataset.id);
            renderTCControls();

            // Show prompt ALWAYS on selection per user request
            setTimeout(showStripeEditPrompt, 50);
        };

        el.onclick = handler;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler(e);
            }
        });
    });

    // Delete
    document.querySelectorAll('[data-delete-id]').forEach(el => {
        const handler = (e) => {
            e.stopPropagation(); // Stop bubbling to item select
            const id = parseFloat(el.dataset.deleteId);
            tcState.stripePattern = tcState.stripePattern.filter(s => s.id !== id);

            // Dismiss prompts
            const prompts = ['stripeEditPrompt', 'stripeContinuePrompt', 'spaceNextPrompt'];
            prompts.forEach(p => {
                const el = document.getElementById(p);
                if (el) el.remove();
            });

            renderTCControls();
            renderTCCanvas();
        };

        el.onclick = handler;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler(e);
            }
        });
    });
    // Color
    document.querySelectorAll('.color-swatch').forEach(el => {
        el.onclick = () => {
            const colorName = el.dataset.name;
            const colorObj = TC_COLORS.find(c => c.name === colorName);
            if (window.gtag) window.gtag('event', 'select_content', { content_type: 'stripe_color', item_id: colorName });
            if (tcState.activeStripeId && tcState.stripePattern.length > 0) {
                const item = tcState.stripePattern.find(i => i.id === tcState.activeStripeId);
                if (item && item.type === 'stripe') {
                    item.color = colorObj;
                }
            }
            // else: Do nothing. Base color is fixed.

            // Always end Picking Mode and show next prompt
            tcState.pickingColor = false;

            // Dismiss Tooltip if exists
            const tooltip = document.getElementById('stripeEditPrompt');
            if (tooltip) tooltip.remove();

            // Show "Select Space" Hint always
            setTimeout(showContinuePrompt, 300);


            renderTCControls();
            renderTCCanvas();
        };
    });

    // Done Selecting Button
    const btnDone = document.getElementById('btn-done-selecting');
    if (btnDone) {
        btnDone.onclick = () => {
            // TRANSITION TO TZITZIT STEP
            updateMobileStep('tzitzit');

            setTimeout(showTzitzitPrompt, 600);
        };
    }

    // Tzitzit Selection (Gallery)
    const tzGallery = document.getElementById('tc-tzitzitGallery');
    if (tzGallery) {
        tzGallery.querySelectorAll('.tzitzit-card').forEach(card => {
            // Note: Click logic for image lightbox handled inline
            card.onclick = (e) => {
                // Ignore if clicked on image (handled by lightbox)
                if (e.target.tagName === 'IMG') return;

                const id = card.dataset.id;
                tcState.tzitzitType = TC_TZITZIT_TYPES.find(t => t.id === id);
                if (window.gtag) window.gtag('event', 'select_content', { content_type: 'tzitzit', item_id: id });

                // Dismiss prompt
                const p = document.getElementById('tzitzitPrompt');
                if (p) p.remove();

                // Trigger Next Step (Atara)
                setTimeout(showAtaraPrompt, 300);

                renderTCControls();
                renderTCCanvas();
                updateTCSummary();

                // TRANSITION TO ATARA STEP
                if (id !== 'none') {
                    updateMobileStep('atara');
                }
            };
        });
    }

    // Atara Selection (New Horizontal)
    const ataraSelector = document.getElementById('tc-ataraSelector');
    if (ataraSelector) {
        ataraSelector.querySelectorAll('.tzitzit-card').forEach(card => {
            card.onclick = () => {
                const id = card.dataset.id;
                tcState.ataraStyle = TC_ATARA_STYLES.find(s => s.id === id);
                if (window.gtag) window.gtag('event', 'select_content', { content_type: 'atara', item_id: id });

                // Dismiss Prompt
                const prompt = document.getElementById('ataraPrompt');
                if (prompt) prompt.remove();

                renderTCControls();
                renderTCCanvas();
                renderTCControls();
                renderTCCanvas();
                updateTCSummary();

                // Move Canvas to Bottom
                moveCanvasToBottom();

                // TRANSITION TO FINAL STEP
                updateMobileStep('final');
            };
        });
    }

    // --- Save Options Listeners ---
    const btnSave = document.getElementById('tc-btn-save-design');
    if (btnSave) {
        btnSave.onclick = saveCurrentDesign;
    }

    const btnSaveDownload = document.getElementById('tc-btn-save-download');
    if (btnSaveDownload) {
        btnSaveDownload.onclick = async () => {
            await saveCurrentDesign();
            downloadDesignImage();
        };
    }
}

function downloadDesignImage() {
    const canvas = document.getElementById('tc-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `Tallit_Design_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ---------------- Integration Logic (Tooltip & API) ----------------

function createNameTooltip() {
    if (document.getElementById('namePathPrompt')) return;
    const tooltip = document.createElement('div');
    tooltip.id = 'namePathPrompt'; tooltip.innerText = 'Enter Name';
    const input = document.getElementById('tc-customerName');
    if (input && input.parentElement) {
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(tooltip);
        tooltip.style.top = '120%'; tooltip.style.left = '0';
    }
}

let hasShownTooltip = false;
function handleScrollForTooltip() {
    if (hasShownTooltip || tcState.userName) return;
    const input = document.getElementById('tc-customerName');
    if (!input) return;
    const rect = input.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        document.getElementById('namePathPrompt')?.classList.add('visible');
        hasShownTooltip = true;
    }
}

function dismissTooltip() {
    document.getElementById('namePathPrompt')?.classList.remove('visible');
}

function attachIntegrationListeners() {
    // Add Stripe Buttons
    document.querySelectorAll('.btn-add-stripe').forEach(btn => {
        btn.onclick = () => addStripeItem('stripe', parseFloat(btn.dataset.size));
    });
    document.querySelectorAll('.btn-add-space').forEach(btn => {
        btn.onclick = () => addStripeItem('space', parseFloat(btn.dataset.size));
    });

    // Flip View
    const flipBtn = document.getElementById('tc-flipViewBtn');
    if (flipBtn) {
        flipBtn.onclick = () => {
            tcState.isBackView = !tcState.isBackView;
            flipBtn.innerText = tcState.isBackView ? "View Front" : "View Back";
            renderTCCanvas();
        };
    }

    // Save
    const saveBtn = document.getElementById('tc-saveBtn');
    if (saveBtn) saveBtn.onclick = saveCurrentDesign;

    // Login/Name
    const nameInput = document.getElementById('tc-customerName');
    if (nameInput) {
        nameInput.addEventListener('input', dismissTooltip);

        // Handle Enter Key
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameInput.blur(); // Triggers the onblur logic below
            }
        });

        nameInput.onblur = () => {
            if (nameInput.value && nameInput.value !== tcState.userName) {
                dismissTooltip(); // Ensure tooltip goes away
                loginUser(nameInput.value);
                // Trigger next step in walkthrough
                setTimeout(showStripePrompt, 500);
            }
        };
    }
    // New Design Button
    const newDesignBtn = document.getElementById('tc-btn-new-design');
    if (newDesignBtn) {
        newDesignBtn.onclick = () => {
            // Confirm if unsaved? No, just reset for now as per user request to start clear
            resetTCDesign();
        };
    }
}

function resetTCDesign() {
    // 1. Reset State
    if (window.gtag) window.gtag('event', 'reset_design', { event_category: 'tallit_configurator' });
    tcState.stripePattern = [];
    tcState.activeStripeId = null;
    tcState.baseColor = TC_BASE_COLOR; // Reset to fixed white
    tcState.tzitzitType = TC_TZITZIT_TYPES[0]; // None
    tcState.ataraStyle = TC_ATARA_STYLES[0]; // None
    tcState.isBackView = false;
    tcState.pickingColor = false;

    // Clear ANY active prompts
    ['stripeEditPrompt', 'stripeContinuePrompt', 'stripeBuilderPrompt', 'doneValuesPrompt', 'spaceNextPrompt', 'tzitzitPrompt', 'ataraPrompt'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Show Prompt for "First Stripe" again
    setTimeout(showStripePrompt, 300);

    // 2. Reset UI Visibility
    document.getElementById('row-stripes').style.display = 'flex';
    document.getElementById('row-stripes').style.pointerEvents = 'auto'; // Re-enable interaction
    document.getElementById('row-spaces').style.display = 'none';

    // Hide Later Steps
    ['tzitzit-selection-area', 'atara-selection-area', 'final-options-area'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Reset Done Button
    const btnDone = document.getElementById('btn-done-selecting');
    if (btnDone) {
        btnDone.style.display = 'inline-block';
        btnDone.disabled = true;
        btnDone.style.opacity = '0.3';
        btnDone.style.pointerEvents = 'none';
    }

    // Reset Color Picker Text
    const colorPrompt = document.getElementById('tc-colorPrompt');
    if (colorPrompt) {
        colorPrompt.innerText = "Select Stripe Color:";
        colorPrompt.style.color = "";
        colorPrompt.style.fontWeight = "normal";
    }
    const colorPickerContainer = document.getElementById('tc-stripeColorPicker')?.parentElement;
    if (colorPickerContainer) {
        colorPickerContainer.style.border = "none";
        colorPickerContainer.style.background = "transparent";
        colorPickerContainer.style.padding = "0";
    }

    // 3. Re-Render
    moveCanvasToTop();
    renderTCCanvas();
    renderTCControls();
    updateTCSummary();

    // Show prompt for the new stripe
    setTimeout(showStripeEditPrompt, 100);
}

function showStripePrompt() {
    if (document.getElementById('stripeBuilderPrompt')) return;
    const builderControls = document.querySelector('.builder-controls');
    if (!builderControls) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'stripeBuilderPrompt';
    tooltip.innerText = 'Now, click a button to add your first stripe!';
    tooltip.className = 'walkthrough-tooltip'; // Re-use styling or add new

    // Position it
    builderControls.style.position = 'relative';
    builderControls.appendChild(tooltip);

    // Position ABOVE the controls
    tooltip.style.top = '-80px'; /* Clears the buttons completely */
    tooltip.style.left = '70%';
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.width = '200px'; // Ensure nice wrapping

    // Add visible class after a tick for transition
    setTimeout(() => tooltip.classList.add('visible'), 50);

    // Auto-dismiss on interaction
    const buttons = builderControls.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            tooltip.classList.remove('visible');
            setTimeout(() => tooltip.remove(), 500);
        }, { once: true });
    });
}


function addStripeItem(type, size) {
    const usage = tcState.stripePattern.reduce((acc, i) => acc + i.width, 0);
    if (usage + size > 12) return alert("Zone limit reached (12 inches)");
    const newItem = { id: Math.random(), type, width: size, color: TC_COLORS[3] }; // Default Black
    tcState.stripePattern.push(newItem);
    tcState.activeStripeId = newItem.id;

    // Analytics
    if (window.gtag) window.gtag('event', 'design_interaction', {
        event_category: 'tallit_configurator',
        action: 'add_' + type,
        label: size + ' inch'
    });

    // Force Color Cycle
    if (type === 'stripe') {
        tcState.pickingColor = true;
    }

    // Dismiss all prompts to avoid cleanup clutter
    ['stripeEditPrompt', 'stripeContinuePrompt', 'stripeBuilderPrompt', 'doneValuesPrompt', 'spaceNextPrompt'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });


    // Show "Done Hint" if valid (stripe)
    if (type === 'stripe') {
        setTimeout(showDonePrompt, 300);
    } else {
        // Space added - Always pop the hint
        setTimeout(showSpaceNextPrompt, 300);
    }

    renderTCControls();
    renderTCCanvas();

    // Show "Pick Color" prompt for the new stripe
    if (type === 'stripe') {
        setTimeout(showStripeEditPrompt, 300);
    }
}

function showDonePrompt() {
    if (document.getElementById('doneValuesPrompt')) return;
    const doneBtn = document.getElementById('btn-done-selecting');
    if (!doneBtn || doneBtn.disabled) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'doneValuesPrompt';
    tooltip.innerText = 'Click here when done selecting stripes';
    tooltip.className = 'walkthrough-tooltip';

    doneBtn.parentElement.style.position = 'relative';
    doneBtn.parentElement.appendChild(tooltip);

    tooltip.style.top = '-50px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, 0)';
    tooltip.style.width = '180px';

    setTimeout(() => tooltip.classList.add('visible'), 50);

    // Auto dismiss after 4s
    setTimeout(() => {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.remove(), 500);
    }, 4000);
}

function showStripeEditPrompt() {
    // Target the currently active (selected) item
    const stack = document.getElementById('tc-stripeStack');
    const activeItem = stack ? stack.querySelector('.stripe-item.active') : null;

    // Only show if there IS an active item (don't fallback to last randomly)
    const targetItem = activeItem;

    if (!targetItem) {
        // If no item is selected, hide the prompt if it exists
        const existing = document.getElementById('stripeEditPrompt');
        if (existing) existing.remove();
        return;
    }

    let tooltip = document.getElementById('stripeEditPrompt');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'stripeEditPrompt';
        tooltip.className = 'walkthrough-tooltip';
        document.body.appendChild(tooltip);
        // Smooth entry
        setTimeout(() => tooltip.classList.add('visible'), 50);

        // Attach Dismiss Listener (Only for new tooltips)
        const dismiss = () => {
            tooltip.classList.remove('visible');
            setTimeout(() => tooltip.remove(), 500);
        };
        setTimeout(() => {
            document.addEventListener('click', dismiss, { once: true });
        }, 100);
    }

    tooltip.innerText = 'Pick Color or Delete Stripe';


    // Position it manually
    const updatePosition = () => {
        const rect = targetItem.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Position ABOVE the item with ample clearance
        tooltip.style.top = `${rect.top + scrollTop - 70}px`;
        tooltip.style.left = `${rect.left + scrollLeft + (rect.width / 2)}px`;
        tooltip.style.transform = 'translate(-50%, 0)'; // Just center horizontally
    };

    updatePosition();

    // Add visible class (Redundant but harmless here)
    setTimeout(() => tooltip.classList.add('visible'), 50);
}

function showContinuePrompt() {
    // Check if user is already done (Tzitzit area visible)
    const tzArea = document.getElementById('tzitzit-selection-area');
    if (tzArea && tzArea.style.display !== 'none') return;

    // Ensure we actually have stripes
    if (tcState.stripePattern.length === 0) return;

    const existing = document.getElementById('stripeContinuePrompt');
    if (existing) existing.remove();
    const builderControls = document.querySelector('.builder-controls'); // Or target the add buttons container
    if (!builderControls) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'stripeContinuePrompt';
    tooltip.className = 'walkthrough-tooltip';
    tooltip.style.minWidth = '250px';

    // Content (No Button)
    tooltip.innerHTML =
        '<div style="margin-bottom: 0;"><strong>Great Choice!</strong><br>Now select a <strong>Space</strong>, <strong>Delete</strong> this stripe, or click <strong>Done Selecting</strong> below.</div>';

    // Position relative to builder controls (Buttons)
    builderControls.style.position = 'relative';
    builderControls.appendChild(tooltip);

    tooltip.style.top = '-110px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';

    // Visible
    setTimeout(() => tooltip.classList.add('visible'), 50);
}

function showSpaceNextPrompt() {
    if (document.getElementById('spaceNextPrompt')) return;
    const builderControls = document.querySelector('.builder-controls');
    if (!builderControls) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'spaceNextPrompt';
    tooltip.className = 'walkthrough-tooltip';
    tooltip.style.minWidth = '250px';

    // Position same as continue prompt
    tooltip.style.top = '-110px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';

    tooltip.innerHTML =
        '<div style="margin-bottom: 0;"><strong>Space Added!</strong><br>Select another <strong>Stripe</strong> or <strong>Delete</strong> the space.</div>';

    builderControls.style.position = 'relative';
    builderControls.appendChild(tooltip);

    // Smooth entry
    setTimeout(() => tooltip.classList.add('visible'), 50);
}

// --- Mobile Step Manager ---
function updateMobileStep(step) {
    // Only apply strict step logic on mobile (check width or just logical flow for all)
    // For now, we apply this logic generally as it cleans up the UI for everyone
    const stripeArea = document.querySelector('.builder-controls');
    const tzitzitArea = document.getElementById('tzitzit-selection-area');
    const ataraArea = document.getElementById('atara-selection-area');
    const finalArea = document.getElementById('final-options-area');


    // Function to safely set display
    const setDisplay = (el, val) => { if (el) el.style.display = val; };

    if (step === 'stripes') {
        setDisplay(stripeArea, 'block');
        setDisplay(tzitzitArea, 'none');
        setDisplay(ataraArea, 'none');
        setDisplay(finalArea, 'none');

    } else if (step === 'tzitzit') {
        setDisplay(tzitzitArea, 'block');
        tzitzitArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (step === 'atara') {
        setDisplay(ataraArea, 'block');
        ataraArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (step === 'final') {
        setDisplay(finalArea, 'block');
        finalArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


function showTzitzitPrompt() {
    if (document.getElementById('tzitzitPrompt')) return;
    const container = document.getElementById('tzitzit-selection-area');
    if (!container) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'tzitzitPrompt';
    tooltip.className = 'walkthrough-tooltip';
    tooltip.style.minWidth = '250px';
    tooltip.style.top = '-60px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';

    tooltip.innerHTML =
        '<div style="margin-bottom: 0;"><strong>Next Step</strong><br>Select your <strong>Tzitzit</strong> style.</div>';

    container.style.position = 'relative';
    container.appendChild(tooltip);

    setTimeout(() => tooltip.classList.add('visible'), 50);
}

function showAtaraPrompt() {
    if (document.getElementById('ataraPrompt')) return;
    const container = document.getElementById('atara-selection-area');
    if (!container) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'ataraPrompt';
    tooltip.className = 'walkthrough-tooltip';
    tooltip.style.minWidth = '250px';
    tooltip.style.top = '-60px'; // Adjust for Atara header
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';

    tooltip.innerHTML =
        '<div style="margin-bottom: 0;"><strong>Final Polish</strong><br>Select an <strong>Atara</strong> to complete your design.</div>';

    container.style.position = 'relative';
    container.appendChild(tooltip);

    setTimeout(() => tooltip.classList.add('visible'), 50);

    // Scroll to Atara
    // container.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Handled by updateMobileStep
}

// --- API ---

async function loginUser(name) {
    if (!name) return;
    try {
        const res = await fetch(`${CONFIG.apiBase}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        const data = await res.json();
        if (data.user) {
            tcState.userId = data.user.id; tcState.userName = data.user.name;
            if (window.gtag) window.gtag('event', 'login', { method: 'name_entry' });
            alert(`Welcome back, ${tcState.userName}!`);
            loadUserDesignsAPI(tcState.userId); // Load designs on login
        }
    } catch (e) { console.error(e); }
}

async function saveCurrentDesign() {
    if (!tcState.userId) {
        const name = prompt("Please enter your name to login:");
        if (name) await loginUser(name); else return;
    }

    // Prompt for Design Name
    const designName = prompt("Enter a name for this design (e.g., 'Holiday Tallit'):", "My Custom Tallit");
    if (!designName) return; // User cancelled

    const designData = { baseColor: tcState.baseColor, stripePattern: tcState.stripePattern, tzitzitType: tcState.tzitzitType, ataraStyle: tcState.ataraStyle };
    try {
        await fetch(`${CONFIG.apiBase}/designs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: tcState.userId, designData, designName })
        });
        if (window.gtag) window.gtag('event', 'save_design', { event_category: 'tallit_configurator', design_name: designName });
        alert("Design Saved Successfully!");
        loadUserDesignsAPI(tcState.userId); // Refresh list
    } catch (e) { alert("Save failed"); }
}

export async function showGlobalStats() {
    try {
        const res = await fetch(`${CONFIG.apiBase}/stats`);
        const data = await res.json();
        alert(`Total Users: ${data.totalUsers}\nDesigns: ${data.totalDesigns}\nTop Color: ${data.popularColor}\nTop Tzitzit: ${data.popularTzitzit}`);
    } catch (e) { alert("Stats Error"); }
}

async function loadUserDesignsAPI(userId) {
    try {
        const response = await fetch(`${CONFIG.apiBase}/designs/${userId}`);
        const designs = await response.json();
        renderSavedDesignsList(designs);
    } catch (error) {
        console.error("Load Error:", error);
    }
}

function renderSavedDesignsList(designs) {
    const container = document.getElementById('tc-saved-designs-list');
    if (!container) return;

    if (designs.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; margin-top: 5px;">
            <strong style="color: #d4af37;">Saved Designs:</strong>
            <ul style="list-style: none; padding: 0; margin-top: 5px; max-height: 100px; overflow-y: auto;">
                ${designs.map(d => `
                    <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span style="opacity: 0.9;">${d.designName || 'Untitled'} <small style="opacity:0.5;">(${new Date(d.timestamp).toLocaleDateString()})</small></span>
                        <button onclick="window.restoreDesign('${d.id}')" style="background: transparent; border: 1px solid #aaa; color: #fff; cursor: pointer; border-radius: 3px; font-size: 0.7rem; padding: 2px 6px;">Load</button>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    // Expose restoration globally so inline onclick works
    window.restoreDesign = (designId) => {
        const design = designs.find(d => d.id === designId);
        if (design) restoreDesignState(design.data);
    };
}

function restoreDesignState(data) {
    if (!data) return;

    // 1. Restore State (safely mapping back to config objects if needed)
    tcState.stripePattern = data.stripePattern || [];

    // Restore Base Color
    if (data.baseColor) tcState.baseColor = data.baseColor;

    // Restore Tzitzit (Find by ID to ensure logic works)
    if (data.tzitzitType) {
        const found = TC_TZITZIT_TYPES.find(t => t.id === data.tzitzitType.id);
        if (found) tcState.tzitzitType = found;
    }

    // Restore Atara
    if (data.ataraStyle) {
        const found = TC_ATARA_STYLES.find(t => t.id === data.ataraStyle.id);
        if (found) tcState.ataraStyle = found;
    }

    // 2. Re-Render Everything
    renderTCCanvas();
    renderTCControls();
    updateTCSummary();

    // 3. UI Flow Updates
    // If designs has stripes, show 'Done' state visuals
    if (tcState.stripePattern.length > 0) {
        document.getElementById('row-stripes').style.display = 'none'; // Assuming "Done" state
        document.getElementById('tzitzit-selection-area').style.display = 'block';
        if (tcState.tzitzitType.id !== 'none') {
            document.getElementById('atara-selection-area').style.display = 'block';
        }
        document.getElementById('final-options-area').style.display = 'block';

        // Move Canvas if complete
        if (tcState.ataraStyle && tcState.ataraStyle.id !== 'none') {
            moveCanvasToBottom();
        }
    }

    alert("Design Loaded!");
}

// ---------------- Lightbox Logic ----------------
window.openLightbox = function (event, imgSrc, title) {
    if (event) event.stopPropagation(); // Stop card selection

    let lightbox = document.getElementById('tc-image-lightbox');
    if (!lightbox) {
        // Create it if missing
        lightbox = document.createElement('div');
        lightbox.id = 'tc-image-lightbox';
        lightbox.className = 'lightbox-overlay';
        lightbox.onclick = window.closeLightbox;
        lightbox.innerHTML = `
            <div class="lightbox-content" onclick="event.stopPropagation()">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <h3 id="lb-title" style="margin:0; color:#d4af37;"></h3>
                    <span class="lightbox-close" onclick="window.closeLightbox()" style="cursor:pointer; font-size:1.5rem; color:#fff;">×</span>
                </div>
                <img id="lb-image" src="" alt="Zoomed View" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:4px; background:white; padding:1rem;">
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    const imgEl = document.getElementById('lb-image');
    if (imgEl) imgEl.src = imgSrc;

    const titleEl = document.getElementById('lb-title');
    if (titleEl) titleEl.innerText = title;

    lightbox.style.display = 'flex';
    requestAnimationFrame(() => lightbox.classList.add('visible'));
};

window.closeLightbox = function () {
    const lightbox = document.getElementById('tc-image-lightbox');
    if (lightbox) {
        lightbox.classList.remove('visible');
        setTimeout(() => lightbox.style.display = 'none', 300);
    }
};
// --- Canvas Location Helpers ---
function moveCanvasToBottom() {
    const canvasArea = document.querySelector('.canvas-area');
    const finalArea = document.getElementById('final-options-area');
    // Ensure we move it to the main container scope, after Atara selection area or before final options
    if (canvasArea && finalArea) {
        // Insert before final options (so it is below Atara)
        if (finalArea.parentNode) {
            finalArea.parentNode.insertBefore(canvasArea, finalArea);
            // Add a class or style to ensure it looks good FULL WIDTH
            canvasArea.style.width = '100%';
            canvasArea.style.marginBottom = '2rem';
        }
    }
}

function moveCanvasToTop() {
    const canvasArea = document.querySelector('.canvas-area');
    const designerContainer = document.querySelector('.designer-container');
    if (canvasArea && designerContainer) {
        // If it is not already in designerContainer
        if (canvasArea.parentElement !== designerContainer) {
            designerContainer.prepend(canvasArea);
            // Reset styles
            canvasArea.style.width = '';
            canvasArea.style.marginBottom = '';
        }
    }
}
