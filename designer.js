/* ==========================================================================
   TEKTON DESIGNER — 2D technical layout + smart auto configurator
   Engineering constants and rules per Tekton standard practice.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  var DEDUCTION_LEFT   = 185;
  var DEDUCTION_RIGHT  = 185;
  var DEDUCTION_FRONT  = 240;
  var DEDUCTION_BACK   = 230;
  var RECESS_MIN       = 25;
  var FRAME_DEPTH      = 60;
  var FRAME_WIDTH      = 100;

  /* door-zone drawing geometry (mm) */
  var LANDING_SET      = 45;   /* landing door track, inside the shaft front face */
  var DOOR_GAP         = 95;   /* clear gap between landing door and car door     */
  var LEAF_THK         = 42;   /* drawn thickness of a door leaf                  */

  var LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxTDVLx_2cz4FPchH8sOONCNb4uXlEpGHI70f4OZfkEPpptj-k6CC0kfwbP5eZDAK8/exec';

  var FINISHES = {
    gold:  { label: 'Brass gold',     tint: 'rgba(199,154,84,.16)',  leaf: '#C79A54' },
    steel: { label: 'Brushed steel',   tint: 'rgba(185,191,198,.20)', leaf: '#9AA3AC' },
    glass: { label: 'Panoramic glass', tint: 'rgba(143,168,184,.20)', leaf: '#8FA8B8' }
  };

  var DOOR_SIZES = [600, 700, 800, 900, 1000, 1100, 1200];

  /* ---------- state ---------- */
  var st = {
    shaftW: 1750,
    shaftD: 1524,
    doorW: 800,
    doorType: 'CO',
    finish: 'gold',
    open: false,
    customized: false
  };

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('dwg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  /* logo used inside the cabin + PDF header */
  function loadLogo(src) {
    var im = new Image();
    im.onload = function () { im._ok = true; draw(); };
    im.onerror = function () { im._ok = false; };
    im.src = src;
    return im;
  }

  /* Keep these paths relative to designer.html. Do not put the logo in CSS;
     the drawing is rendered directly into #dwg so it also appears in PDF export. */
  var logoDarkInk = loadLogo('./assets/logo-full.png');
  var logoLightInk = loadLogo('./assets/logo-full-light.png');

  /* ---------- engineering rules ---------- */
  function cabin(w, d) {
    return {
      w: Math.max(w - (DEDUCTION_LEFT + DEDUCTION_RIGHT), 0),
      d: Math.max(d - (DEDUCTION_FRONT + DEDUCTION_BACK), 0)
    };
  }

  function canFitCO(shaftW, dw) {
    return shaftW >= (2 * dw + 2 * RECESS_MIN + 50);
  }

  function requiredShaftW(dw, type) {
    if (type === 'CO') return 2 * dw + 2 * RECESS_MIN + 50;
    return dw + (0.5 * dw + 25) + DEDUCTION_LEFT + RECESS_MIN;
  }

  function autoMatch(shaftW) {
    var co = [1000, 900, 800, 700, 600], i;
    for (i = 0; i < co.length; i++) {
      if (canFitCO(shaftW, co[i])) return { doorW: co[i], doorType: 'CO' };
    }
    if (shaftW >= 1435) return { doorW: 800, doorType: 'SO' };
    if (shaftW >= 1285) return { doorW: 700, doorType: 'SO' };
    return { doorW: 600, doorType: 'SO' };
  }

  /* discrete capacity table by cabin floor area (m²) */
  function capacityFor(areaM2) {
    if (areaM2 < 0.65) return { pax: 2,  kg: 136 };
    if (areaM2 < 0.82) return { pax: 3,  kg: 204 };
    if (areaM2 < 1.02) return { pax: 4,  kg: 272 };
    if (areaM2 < 1.22) return { pax: 5,  kg: 340 };
    if (areaM2 < 1.45) return { pax: 6,  kg: 408 };
    if (areaM2 < 1.75) return { pax: 8,  kg: 544 };
    if (areaM2 < 2.05) return { pax: 10, kg: 680 };
    if (areaM2 < 2.45) return { pax: 13, kg: 884 };
    return { pax: 16, kg: 1088 };
  }

  function typeLabel(t) { return t === 'CO' ? 'Center opening (CO)' : 'Side opening (2SO — right)'; }
  function typeShort(t) { return t === 'CO' ? 'centre opening' : 'side opening'; }

  function model() {
    var cab = cabin(st.shaftW, st.shaftD);
    var area = (cab.w * cab.d) / 1e6;
    var cap = capacityFor(area);
    var reqW = requiredShaftW(st.doorW, st.doorType);
    return { cab: cab, area: area, cap: cap, reqW: reqW, ok: st.shaftW >= reqW };
  }

  /* ---------- theme-aware palette ---------- */
  function palette() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      dark: dark,
      paper: dark ? '#0D1E2F' : '#FFFFFF',
      grid: dark ? 'rgba(148,175,205,.10)' : 'rgba(14,42,82,.07)',
      ink: dark ? '#E6ECF3' : '#122444',
      muted: dark ? '#9BAABC' : '#5A6579',
      wall: dark ? '#8FA6C0' : '#334155',
      shaftFill: dark ? 'rgba(223,174,94,.07)' : 'rgba(254,243,199,.42)',

      /* cabin — navy structure */
      cabinLine: dark ? '#9CC2F2' : '#0E2A52',
      cabinFill: dark ? 'rgba(255,255,255,.05)' : '#FFFFFF',

      /* car door — brand gold */
      carLine: dark ? '#E7B96A' : '#8A5814',
      carFill: dark ? 'rgba(231,185,106,.55)' : '#D9A44F',

      /* landing door — engineering blue */
      landLine: dark ? '#8FB6E8' : '#1D4ED8',
      landFill: dark ? 'rgba(143,182,232,.50)' : '#93B4F5',

      /* jamb / frame — graphite */
      frame: dark ? '#7E8CA0' : '#475569',

      closed: dark ? '#3FBF86' : '#059669',
      opened: dark ? '#F0665F' : '#dc2626',
      gold: dark ? '#DFAE5E' : '#B45309'
    };
  }

  /* ---------- canvas plumbing ---------- */
  var CW = 0, CH = 0;

  function sizeCanvas() {
    var box = canvas.parentElement.getBoundingClientRect();
    CW = Math.max(320, Math.round(box.width));
    CH = Math.round(Math.min(700, Math.max(420, CW * 0.72)));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    canvas.style.width = CW + 'px';
    canvas.style.height = CH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function line(x1, y1, x2, y2, color, w, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = w || 1;
    ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function tick(x, y, vertical, color) {
    if (vertical) line(x - 5, y, x + 5, y, color, 1.5);
    else line(x, y - 5, x, y + 5, color, 1.5);
  }

  function label(text, x, y, color, size, weight, align, rotate) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = (weight || 700) + ' ' + (size || 12) + 'px Inter, system-ui, sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (rotate) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.fillText(text, 0, 0); }
    else ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* ---------- drawing ---------- */
  function draw() {
    if (!CW) sizeCanvas();
    var p = palette();
    var m = model();
    var cab = m.cab;

    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, CW, CH);

    /* blueprint grid */
    var g = 34, i;
    for (i = g; i < CW; i += g) line(i, 0, i, CH, p.grid, 1);
    for (i = g; i < CH; i += g) line(0, i, CW, i, p.grid, 1);

    /* scale + placement */
    var padL = 108, padR = 112, padT = 92, padB = 118;
    var availW = CW - padL - padR;
    var availH = CH - padT - padB;
    var scale = Math.min(availW / st.shaftW, availH / st.shaftD);
    var sw = st.shaftW * scale, sd = st.shaftD * scale;
    var x0 = padL + (availW - sw) / 2;
    var y0 = padT + (availH - sd) / 2;

    /* masonry wall band */
    var wall = 9;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - wall, y0 - wall, sw + wall * 2, sd + wall * 2);
    ctx.rect(x0, y0, sw, sd);
    ctx.clip('evenodd');
    ctx.fillStyle = p.dark ? 'rgba(143,166,192,.16)' : 'rgba(51,65,85,.12)';
    ctx.fillRect(x0 - wall, y0 - wall, sw + wall * 2, sd + wall * 2);
    for (i = -sd; i < sw + sd; i += 9) {
      line(x0 - wall + i, y0 - wall, x0 - wall + i + sd + wall * 2, y0 + sd + wall, p.wall, .7);
    }
    ctx.restore();

    /* shaft */
    ctx.fillStyle = p.shaftFill;
    ctx.fillRect(x0, y0, sw, sd);
    ctx.strokeStyle = p.wall; ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, sw, sd);
    ctx.strokeStyle = p.wall; ctx.lineWidth = 1;
    ctx.strokeRect(x0 - wall, y0 - wall, sw + wall * 2, sd + wall * 2);

    /* ---------- geometry of the door zone ---------- */
    var cx = x0 + DEDUCTION_LEFT * scale;
    var cy = y0 + DEDUCTION_BACK * scale;
    var cw = cab.w * scale, ch = cab.d * scale;
    var cyF = cy + ch;                       /* cabin front wall */

    var sill = y0 + sd;                      /* shaft front inner face */
    var yLand = sill - LANDING_SET * scale;  /* landing door track     */
    var yCar  = yLand - DOOR_GAP * scale;    /* car door track         */
    var leafT = Math.max(5, LEAF_THK * scale);

    var dw = st.doorW * scale;
    var fw = FRAME_WIDTH * scale;
    var openLeft;

    if (st.doorType === 'CO') openLeft = x0 + (sw - dw) / 2;
    else openLeft = x0 + DEDUCTION_LEFT * scale + RECESS_MIN * scale;
    openLeft = Math.max(x0 + fw + 2, Math.min(openLeft, x0 + sw - dw - fw - 2));
    var openRight = openLeft + dw;

    /* ---------- cabin: walls broken at the door, with pocket returns ---------- */
    var yPocket = yCar - leafT * 1.15;
    var runBase = (st.doorType === 'CO' ? dw * 0.55 : dw * 0.22) + 18;
    var pocketRun = Math.max(10, Math.min(runBase, (openLeft - x0) - 4));
    var pocketRunR = Math.max(10, Math.min(st.doorType === 'CO' ? runBase : dw * 0.6 + 18, (x0 + sw - openRight) - 4));

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.fillStyle = p.cabinFill; ctx.fill();
    ctx.fillStyle = FINISHES[st.finish].tint; ctx.fill();
    ctx.restore();

    var cabPath = [
      [openLeft - pocketRun, yPocket],
      [openLeft, yPocket],
      [openLeft, cyF],
      [cx, cyF],
      [cx, cy],
      [cx + cw, cy],
      [cx + cw, cyF],
      [openRight, cyF],
      [openRight, yPocket],
      [openRight + pocketRunR, yPocket]
    ];

    function tracePath(pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    }

    /* double-line wall: thick stroke, then a hairline of paper down the centre */
    var wallT = Math.max(4.5, Math.min(8, 34 * scale));
    ctx.save();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.strokeStyle = p.cabinLine; ctx.lineWidth = wallT;
    tracePath(cabPath); ctx.stroke();
    ctx.strokeStyle = p.dark ? '#12283F' : '#FFFFFF'; ctx.lineWidth = Math.max(1.2, wallT - 3);
    tracePath(cabPath); ctx.stroke();
    ctx.restore();

    /* ---------- Tekton Logo Inside Cabin Floor ----------
       The old version made the logo too small/light to notice at the actual
       536x420 designer canvas size. Give it a dedicated visible area and keep
       the technical dimensions below it. */
    var logo = p.dark ? logoLightInk : logoDarkInk;
    if (logo && logo._ok && cw > 45 && ch > 45) {
      ctx.save();

      var maxLogoW = Math.min(cw * 0.68, 230);
      var maxLogoH = Math.min(ch * 0.22, 72);
      var ratio = logo.width / logo.height;
      var drawW = maxLogoW;
      var drawH = drawW / ratio;

      if (drawH > maxLogoH) {
        drawH = maxLogoH;
        drawW = drawH * ratio;
      }

      var logoX = cx + (cw - drawW) / 2;
      var logoY = cy + ch * 0.34 - drawH / 2;

      /* Subtle cabin-floor plate makes both light and dark logo variants
         readable without changing the selected cabin finish. */
      var plateW = Math.min(cw * 0.78, drawW + 28);
      var plateH = drawH + 18;
      var plateX = cx + (cw - plateW) / 2;
      var plateY = logoY - 9;
      ctx.fillStyle = p.dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.72)';
      ctx.strokeStyle = p.dark ? 'rgba(255,255,255,.16)' : 'rgba(14,42,82,.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(plateX, plateY, plateW, plateH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.drawImage(logo, logoX, logoY, drawW, drawH);
      ctx.restore();
    }

    var tight = cw < 210;
    label(tight ? (cab.w + ' \u00d7 ' + cab.d + ' mm') : ('INNER CABIN  ' + cab.w + ' \u00d7 ' + cab.d + ' mm'),
          cx + cw / 2, cy + ch * 0.72, p.gold, tight ? 10.5 : 12, 800);
    label(m.cap.pax + ' PAX \u00b7 ' + m.cap.kg + ' KG', cx + cw / 2, cy + ch * 0.72 + (tight ? 14 : 17), p.muted, tight ? 9.5 : 11, 700);

    /* ---------- jambs (100 mm each side) ---------- */
    ctx.save();
    ctx.fillStyle = p.frame;
    ctx.fillRect(openLeft - fw, yLand - leafT * 0.85, fw, leafT * 1.7);
    ctx.fillRect(openRight, yLand - leafT * 0.85, fw, leafT * 1.7);
    ctx.restore();

    /* ---------- door leaves ---------- */
    var ovl = 30 * scale;                      /* leaf overlap past the jamb */
    var halfLeaf = dw / 2 + ovl;

    function pair(yTrack, fill, stroke) {
      if (st.doorType === 'CO') {
        if (st.open) {
          drawLeaf(openLeft - halfLeaf, openLeft, yTrack, leafT, fill, stroke);
          drawLeaf(openRight, openRight + halfLeaf, yTrack, leafT, fill, stroke);
        } else {
          drawLeaf(openLeft, openLeft + dw / 2, yTrack, leafT, fill, stroke);
          drawLeaf(openLeft + dw / 2, openRight, yTrack, leafT, fill, stroke);
        }
      } else {
        var sub = leafT * 1.22;                /* telescopic second track */
        if (st.open) {
          drawLeaf(openRight, openRight + dw / 2 + ovl, yTrack, leafT, fill, stroke);
          drawLeaf(openRight + 2, openRight + dw / 2, yTrack - sub, leafT, fill, stroke);
        } else {
          drawLeaf(openLeft + dw / 2, openRight, yTrack, leafT, fill, stroke);
          drawLeaf(openLeft, openLeft + dw / 2, yTrack - sub, leafT, fill, stroke);
        }
      }
    }

    pair(yCar, p.carFill, p.carLine);
    pair(yLand, p.landFill, p.landLine);

    /* travel arrows */
    if (cw > 120) {
      var ay = (yCar + yLand) / 2;
      if (st.doorType === 'CO') {
        arrowHead(openLeft - 10, ay, 1, p.muted);
        arrowHead(openRight + 10, ay, -1, p.muted);
      } else {
        arrowHead(openRight + fw + 10, ay, -1, p.muted);
      }
    }

    /* ---------- dimensions (all outside the cabin) ---------- */

    /* cabin width — first level above the shaft */
    var cDimY = y0 - wall - 20;
    line(cx, cy, cx, cDimY - 6, p.cabinLine, .8, [4, 3]);
    line(cx + cw, cy, cx + cw, cDimY - 6, p.cabinLine, .8, [4, 3]);
    arrowDim(cx, cDimY, cx + cw, cDimY, p.cabinLine, true);
    labelBox((cw > 190 ? 'CABIN WIDTH  ' : 'CABIN ') + cab.w + ' mm', cx + cw / 2, cDimY, p.cabinLine, p);

    /* shaft width — second level */
    var dimY = y0 - wall - 52;
    line(x0, dimY, x0 + sw, dimY, p.ink, 1.2);
    tick(x0, dimY, false, p.ink); tick(x0 + sw, dimY, false, p.ink);
    label('SHAFT WIDTH  ' + st.shaftW + ' mm', x0 + sw / 2, dimY - 13, p.ink, 12.5, 800);

    /* shaft depth — left of the shaft */
    var dimX = x0 - wall - 30;
    line(dimX, y0, dimX, y0 + sd, p.ink, 1.2);
    tick(dimX, y0, true, p.ink); tick(dimX, y0 + sd, true, p.ink);
    label('SHAFT DEPTH  ' + st.shaftD + ' mm', Math.max(16, dimX - 15), y0 + sd / 2, p.ink, 12.5, 800, 'center', true);

    /* cabin depth — right of the shaft */
    var cDimX = x0 + sw + wall + 30;
    line(cx + cw, cy, cDimX + 6, cy, p.cabinLine, .8, [4, 3]);
    line(cx + cw, cyF, cDimX + 6, cyF, p.cabinLine, .8, [4, 3]);
    arrowDim(cDimX, cy, cDimX, cyF, p.cabinLine, false);
    label('CABIN DEPTH  ' + cab.d + ' mm', Math.min(CW - 14, cDimX + 16), (cy + cyF) / 2, p.cabinLine, 11, 800, 'center', true);

    /* door chain: 100 | clear opening | 100 */
    var chainY = sill + 34;
    [openLeft - fw, openLeft, openRight, openRight + fw].forEach(function (xx) {
      line(xx, yLand + leafT, xx, chainY + 5, p.muted, .8, [3, 3]);
    });
    arrowDim(openLeft - fw, chainY, openLeft, chainY, p.frame, true);
    arrowDim(openLeft, chainY, openRight, chainY, p.landLine, true);
    arrowDim(openRight, chainY, openRight + fw, chainY, p.frame, true);

    if (fw >= 26) {
      label(FRAME_WIDTH + '', openLeft - fw / 2, chainY + 15, p.frame, 10, 800);
      label(FRAME_WIDTH + '', openRight + fw / 2, chainY + 15, p.frame, 10, 800);
    }
    label(st.doorW + ' mm CLEAR \u00b7 ' + (st.doorType === 'CO' ? 'CO' : '2SO-R'),
          (openLeft + openRight) / 2, chainY - 11, p.landLine, 11.5, 800);
    label(st.open ? 'DOORS \u2014 OPEN' : 'DOORS \u2014 CLOSED',
          (openLeft + openRight) / 2, chainY + 16, st.open ? p.opened : p.closed, 10.5, 800);

    /* ---------- legend ---------- */
    legend(p, [
      ['Cabin', p.cabinLine, p.cabinLine],
      ['Car door', p.carFill, p.carLine],
      ['Landing door', p.landFill, p.landLine],
      ['Jamb ' + FRAME_WIDTH + ' mm', p.frame, p.frame]
    ]);

    label('PLAN VIEW · NOT TO PRINT SCALE · ALL DIMENSIONS IN mm', CW / 2, CH - 12, p.muted, 10, 700);
  }

  function drawLeaf(xa, xb, y, t, fill, stroke) {
    var w = xb - xa;
    if (w <= 0) return;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(xa, y - t / 2, w, t);
    ctx.strokeStyle = stroke; ctx.lineWidth = 1.4;
    ctx.strokeRect(xa + .7, y - t / 2 + .7, w - 1.4, t - 1.4);
    /* inner hairline — reads as a sliding panel in plan */
    if (t > 8) {
      ctx.strokeStyle = stroke; ctx.globalAlpha = .45; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xa + 3, y); ctx.lineTo(xb - 3, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* dimension line with solid arrowheads at both ends */
  function arrowDim(x1, y1, x2, y2, color, horizontal) {
    line(x1, y1, x2, y2, color, 1.1);
    if (horizontal) {
      arrowHead(x1, y1, 1, color); arrowHead(x2, y2, -1, color);
      line(x1, y1 - 5, x1, y1 + 5, color, 1);
      line(x2, y2 - 5, x2, y2 + 5, color, 1);
    } else {
      arrowHeadV(x1, y1, 1, color); arrowHeadV(x2, y2, -1, color);
      line(x1 - 5, y1, x1 + 5, y1, color, 1);
      line(x2 - 5, y2, x2 + 5, y2, color, 1);
    }
  }

  function arrowHead(x, y, dir, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 7 * dir, y - 3);
    ctx.lineTo(x + 7 * dir, y + 3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function arrowHeadV(x, y, dir, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 7 * dir);
    ctx.lineTo(x + 3, y + 7 * dir);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* dimension text sitting on a knocked-out chip so the line stays readable */
  function labelBox(text, x, y, color, p) {
    ctx.save();
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    var w = ctx.measureText(text).width + 10;
    ctx.fillStyle = p.dark ? '#0D1E2F' : '#FFFFFF';
    ctx.fillRect(x - w / 2, y - 8, w, 16);
    ctx.restore();
    label(text, x, y, color, 11, 800);
  }

  function legend(p, items) {
    var y = CH - 30, pad = 14, boxW = 13, gap = 7;
    ctx.save();
    ctx.font = '700 10.5px Inter, system-ui, sans-serif';
    var total = 0, i;
    for (i = 0; i < items.length; i++) {
      total += boxW + gap + ctx.measureText(items[i][0]).width + pad;
    }
    var x = Math.max(10, (CW - total) / 2);
    for (i = 0; i < items.length; i++) {
      ctx.fillStyle = items[i][1];
      ctx.fillRect(x, y - 6, boxW, 11);
      ctx.strokeStyle = items[i][2]; ctx.lineWidth = 1.2;
      ctx.strokeRect(x + .6, y - 5.4, boxW - 1.2, 9.8);
      x += boxW + gap;
      ctx.fillStyle = p.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(items[i][0], x, y);
      x += ctx.measureText(items[i][0]).width + pad;
    }
    ctx.restore();
  }

  /* ---------- UI sync ---------- */
  function setChip(el, txt, cls) {
    el.textContent = txt;
    el.className = 'chip' + (cls ? ' ' + cls : '');
  }

  function render() {
    var m = model();

    /* inputs */
    $('sw').value = st.shaftW;
    $('sd').value = st.shaftD;
    $('dtype').value = st.doorType;
    $('dsize').value = String(st.doorW);

    /* match badge */
    setChip($('matchChip'), st.customized ? 'Customised' : 'Auto-matched',
            st.customized ? 'chip--amber' : 'chip--emerald');

    /* widest CO note */
    var widest = 0;
    DOOR_SIZES.forEach(function (d) { if (canFitCO(st.shaftW, d)) widest = d; });
    $('dsizeNote').textContent = widest
      ? 'Widest centre-opening door this shaft accepts: ' + widest + ' mm.'
      : 'Centre opening is not possible at this shaft width — side opening recommended.';

    /* feasibility warning */
    var warn = $('doorWarning');
    if (!m.ok) {
      $('warnShaftW').textContent = st.shaftW;
      $('warnDoorW').textContent = st.doorW;
      $('warnDoorType').textContent = typeShort(st.doorType);
      $('warnReqW').textContent = Math.ceil(m.reqW);
      warn.hidden = false;
    } else {
      warn.hidden = true;
    }

    /* spec table */
    $('oShaft').textContent = st.shaftW + ' × ' + st.shaftD + ' mm';
    $('oCabin').textContent = m.cab.w + ' × ' + m.cab.d + ' mm';
    $('oArea').textContent = m.area.toFixed(2) + ' m²';
    $('oDoor').textContent = st.doorW + ' mm';
    $('oType').textContent = typeLabel(st.doorType);
    $('oCap').textContent = m.cap.pax + ' passengers (' + m.cap.kg + ' kg)';
    $('oFinish').textContent = FINISHES[st.finish].label;

    setChip($('capChip'), m.cap.pax + ' passengers · ' + m.cap.kg + ' kg', 'chip--warn');

    $('doorBtn').textContent = st.open ? 'Close door' : 'Open door';

    /* deep links */
    var msg = 'Tekton lift enquiry%0A' +
      'Shaft: ' + st.shaftW + ' x ' + st.shaftD + ' mm%0A' +
      'Inner cabin: ' + m.cab.w + ' x ' + m.cab.d + ' mm (' + m.area.toFixed(2) + ' sq.m)%0A' +
      'Door: ' + st.doorW + ' mm ' + (st.doorType === 'CO' ? 'CO' : '2SO-R') + '%0A' +
      'Capacity: ' + m.cap.pax + ' passengers / ' + m.cap.kg + ' kg%0A' +
      'Finish: ' + FINISHES[st.finish].label;
    $('waBtn').href = 'https://wa.me/918925448131?text=' + msg;

    draw();
  }

  function applyAuto() {
    var a = autoMatch(st.shaftW);
    st.doorW = a.doorW;
    st.doorType = a.doorType;
    st.customized = false;
  }

  function clampDim(v) {
    v = parseInt(v, 10);
    if (isNaN(v)) return 1750;
    return Math.max(900, Math.min(3000, v));
  }

  /* ---------- events ---------- */
  ['sw', 'sd'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      var v = clampDim(this.value);
      if (id === 'sw') st.shaftW = v; else st.shaftD = v;
      applyAuto();      /* any shaft change resets to auto-match */
      render();
    });
  });

  $('dtype').addEventListener('change', function () {
    st.doorType = this.value; st.customized = true; render();
  });
  $('dsize').addEventListener('change', function () {
    st.doorW = parseInt(this.value, 10); st.customized = true; render();
  });
  $('finishSet').addEventListener('change', function (e) {
    if (e.target.name === 'finish') { st.finish = e.target.value; render(); }
  });
  ['doorBtn', 'doorBtn2'].forEach(function (id) {
    $(id).addEventListener('click', function () { st.open = !st.open; render(); });
  });
  $('resetBtn').addEventListener('click', function () {
    st.shaftW = 1750; st.shaftD = 1524; st.finish = 'gold'; st.open = false;
    var g = $('finishSet').querySelector('input[value="gold"]'); if (g) g.checked = true;
    applyAuto(); render();
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { sizeCanvas(); draw(); }, 140);
  });
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- lead capture ---------- */
  var modal = $('leadModal');
  var leadForm = $('leadForm');
  var leadOk = $('leadSuccess');
  var intent = 'pdf';
  var submitted = false;   /* in-memory only — preview iframe blocks web storage */

  function openModal(which) {
    intent = which;
    if (submitted) { showSuccess(); }
    else { leadForm.hidden = false; leadOk.hidden = true; }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var f = modal.querySelector('input');
    if (f && !submitted) setTimeout(function () { f.focus(); }, 60);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  function showSuccess() {
    leadForm.hidden = true;
    leadOk.hidden = false;
    $('okTitle').textContent = intent === '3d'
      ? 'Your 3D design request is logged'
      : 'Your specification is ready';
    $('okText').textContent = intent === '3d'
      ? 'Our design team will prepare the 3D elevator design for this configuration. You can also download the 2D specification now.'
      : 'Your details have been recorded. Download your customised layout below, or ask our engineers for the full 3D design.';
  }

  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  $('pdfBtn').addEventListener('click', function () { openModal('pdf'); });
  $('threeDBtn').addEventListener('click', function () { openModal('3d'); });
  $('okDownload').addEventListener('click', exportPdf);

  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('leadSubmit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    var m = model();
    var payload = {
      sheetSource: 'CRM_Leads',
      clientName: $('custName').value.trim(),
      clientPhone: $('custMobile').value.trim(),
      siteLocation: $('custLocation').value.trim(),
      shaftWidth: st.shaftW,
      shaftDepth: st.shaftD,
      engineerNotes: 'Cabin ' + m.cab.w + 'x' + m.cab.d + ' mm | ' + m.area.toFixed(2) + ' sq.m | Door ' +
        st.doorW + ' mm ' + st.doorType + ' | ' + m.cap.pax + ' pax / ' + m.cap.kg + ' kg | Finish ' +
        FINISHES[st.finish].label + ' | Mode ' + (st.customized ? 'Customised' : 'Auto-matched')
    };
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(function () {}).then(finish, finish);

    function finish() {
      submitted = true;
      btn.disabled = false; btn.textContent = 'Submit & continue';
      showSuccess();
    }
  });

  /* ---------- PDF export ---------- */
  function exportPdf() {
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) { window.print(); return; }

    var m = model();
    var img;
    try { img = canvas.toDataURL('image/png'); } catch (e) { window.print(); return; }

    var doc = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    var W = 210, H = 297, margin = 12, contentW = W - margin * 2;
    var customerName = ($('custName') && $('custName').value.trim()) || 'Customer';
    var location = ($('custLocation') && $('custLocation').value.trim()) || 'Location not provided';

    /* Single-page professional border */
    doc.setDrawColor(14, 42, 82);
    doc.setLineWidth(0.7);
    doc.rect(6, 6, W - 12, H - 12);
    doc.setDrawColor(199, 154, 84);
    doc.setLineWidth(0.25);
    doc.rect(8, 8, W - 16, H - 16);

    /* Compact header */
    doc.setFillColor(14, 42, 82);
    doc.rect(margin, margin, contentW, 23, 'F');
    doc.setFillColor(166, 108, 27);
    doc.rect(margin, margin + 23, contentW, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('TEKTON ELEVATORS', margin + 4, margin + 9);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Bringing horizons closer through precision technology', margin + 4, margin + 15);
    doc.text('Elevator Designer  |  IS 14665-1 (2000)', margin + 4, margin + 20);

    /* Customer identity at the top */
    var y = margin + 31;
    doc.setTextColor(18, 36, 68);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('PROJECT / CUSTOMER', margin, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    doc.text('Name: ' + customerName, margin, y + 7);
    doc.text('Location: ' + location, margin, y + 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(90, 101, 121);
    doc.text('Generated ' + new Date().toLocaleString('en-IN') + '  |  ' +
             (st.customized ? 'Customised configuration' : 'Auto-matched configuration'), margin, y + 19);

    /* Shaft / cabin drawing first */
    var drawTop = y + 25;
    doc.setTextColor(18, 36, 68);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('2D SHAFT & CABIN PLAN', margin, drawTop);

    var maxW = contentW - 4;
    var ratio = canvas.height / canvas.width;
    var dh = Math.min(maxW * ratio, 91);
    var dwv = dh / ratio;
    var frameX = margin + 2;
    var frameY = drawTop + 4;
    var frameH = dh + 6;
    doc.setFillColor(249, 250, 252);
    doc.setDrawColor(210, 214, 220);
    doc.setLineWidth(0.35);
    doc.roundedRect(frameX, frameY, maxW, frameH, 1.5, 1.5, 'FD');
    doc.addImage(img, 'PNG', frameX + (maxW - dwv) / 2, frameY + 3, dwv, dh);

    /* Specification directly below the shaft design */
    var specTop = frameY + frameH + 8;
    doc.setTextColor(18, 36, 68);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('TECHNICAL SPECIFICATIONS', margin, specTop);

    var rows = [
      ['Inner shaft size (A × B)', st.shaftW + ' × ' + st.shaftD + ' mm'],
      ['Inner cabin size', m.cab.w + ' × ' + m.cab.d + ' mm'],
      ['Cabin floor area', m.area.toFixed(2) + ' m²'],
      ['Door opening size', st.doorW + ' mm'],
      ['Type of opening', st.doorType === 'CO' ? 'Center opening (CO)' : 'Side opening (2SO — right)'],
      ['Capacity of lift', m.cap.pax + ' passengers (' + m.cap.kg + ' kg)'],
      ['Cabin finish', FINISHES[st.finish].label],
      ['Drive & standard', 'Gearless VVVF  |  IS 14665-1 (2000)']
    ];
    var tableY = specTop + 4, rh = 6.4, labelX = margin + 3, valueX = margin + 82;
    for (var i = 0; i < rows.length; i++) {
      doc.setFillColor(i % 2 ? 255 : 247, i % 2 ? 255 : 243, i % 2 ? 255 : 236);
      doc.rect(margin, tableY, contentW, rh, 'F');
      doc.setDrawColor(224, 224, 224); doc.setLineWidth(0.18);
      doc.rect(margin, tableY, contentW, rh);
      doc.setTextColor(90, 101, 121); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.7);
      doc.text(rows[i][0], labelX, tableY + 4.3);
      doc.setTextColor(18, 36, 68); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.7);
      doc.text(String(rows[i][1]), valueX, tableY + 4.3);
      tableY += rh;
    }

    /* Footer inside the page border */
    doc.setDrawColor(199, 154, 84); doc.setLineWidth(0.35);
    doc.line(margin, 274, W - margin, 274);
    doc.setTextColor(90, 101, 121); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.text('Indicative sizing only. Final dimensions confirmed on site by Tekton design engineers.', margin, 279);
    doc.text('Kovilpatti · Tenkasi · Chennai · Bengaluru  |  +91 89254 48131  |  +91 95001 58530  |  info@tektonelevators.com', margin, 284);
    doc.setTextColor(18, 36, 68); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('TEKTON ELEVATORS', W - margin, 289, { align: 'right' });

    /* Download filename includes the entered customer name and location */
    function safeFilePart(value) {
      return String(value || '')
        .replace(/[^a-z0-9\u00C0-\uFFFF]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 55) || 'Customer';
    }
    var name = 'Tekton-Designer-' + safeFilePart(customerName) + '-' + safeFilePart(location) + '.pdf';
    try { doc.save(name); }
    catch (e) { window.open(doc.output('bloburl'), '_blank'); }
  }

  /* ---------- boot ---------- */
  sizeCanvas();
  applyAuto();
  render();
})();