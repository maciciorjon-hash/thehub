// ChemKit: every 2D structure in dHUB is drawn the way ChemDraw's "ACS Document 1996" style draws it. One source for Dora, Echo and Hit Finder
// (tools/sync_chemkit.py carries it into their heads; edit it here only).
//
// ACS Document 1996, in points: bond length 14.4 · line width 0.6 · bold (wedge) width 2.0 · double-bond spacing 18 % of the bond · label font 10 (Arial/Helvetica) ·
// margin between a bond and a label 1.6 · every atom label and bond in black. What this kit keeps: the PROPORTIONS (a bond is 1.44 label heights, a line is 4.2 % of a
// bond, a double bond is spaced 0.18 of a bond), the black ink, a bond length that is the same in every tile where the molecule fits (a small molecule is not blown up
// to the size of its tile, a large one shrinks as a whole, which is what ChemDraw does when you scale a drawing) and the labels as RDKit writes them (OH, NH2, CO2H).
// RDKit.js has no font file to load, so the label face is RDKit's own sans, which is close to Arial. What this kit changes: the absolute size (points become pixels:
// a tile is a few hundred px, a page is not), and a line never thinner than ACS_MIN_LINE px. A label is NEVER larger than its ACS proportion to the bond (a minimum font size made labels bigger than the bond between them
// and they overlapped), and acsSvg checks its own drawing: if two labels still touch, it draws again with smaller labels until they do not.
var ACS_1996 = { bond: 14.4, line: 0.6, bold: 2.0, spacing: 0.18, font: 10, margin: 1.6 };
var ACS_UNIT = 1.5;           // RDKit depicts with a bond of 1.5 units; ACS sets that bond to 14.4 pt, so 1 unit = 9.6 pt
var ACS_BOND_OF_TILE = 0.24;  // the bond length (px) a molecule that fits is drawn with, as a fraction of the tile's height: 30 px in a 124 px tile
var ACS_MIN_FONT = 4, ACS_MIN_LINE = 0.7, ACS_TURN_SIGN = -1;
var ACS_MASS = { C: 12, N: 14, O: 16, F: 19, S: 32, P: 31, Cl: 35.5, Br: 80, I: 127 };
var ACS_BLACK = (function () { var p = { '-1': [0, 0, 0] }; for (var z = 1; z <= 118; z++) p[z] = [0, 0, 0]; return p; })();
// The depiction in coordinate units, from a molblock's atom block: its width and height, and the angle (degrees) that lays its long axis along the tile's long side.
// Null when it cannot be read. An elongated molecule (a degrader) is drawn diagonally by RDKit, which leaves it a bond of 5 px in a tile; turned, it gets twice that.
function acsExtent(mol, w, h, turn) {
  try {
    if (!mol.has_coords()) mol.set_new_coords(false);
    var L = mol.get_molblock().split('\n'), n = parseInt(L[3].substr(0, 3), 10);
    if (!(n > 0) || /V3000/.test(L[3])) return null;
    var X = [], Y = [], M = [], mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { X.push(parseFloat(L[4 + i].substr(0, 10))); Y.push(parseFloat(L[4 + i].substr(10, 10))); M.push(ACS_MASS[L[4 + i].substr(31, 3).trim()] || 20); mx += X[i] / n; my += Y[i] / n; }
    var sxx = 0, syy = 0, sxy = 0;
    for (i = 0; i < n; i++) { sxx += (X[i] - mx) * (X[i] - mx); syy += (Y[i] - my) * (Y[i] - my); sxy += (X[i] - mx) * (Y[i] - my); }
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);                                      // the long axis, counter-clockwise from x
    var tr = Math.sqrt(Math.sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy) + sxx + syy) / Math.sqrt(Math.max(1e-9, sxx + syy - Math.sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy)));
    var rot = turn && n >= 14 && tr > 1.9 ? (w >= h ? -th : Math.PI / 2 - th) : 0;       // how far to turn it, radians counter-clockwise
    if (rot) {                                                                          // the heavier half on the left, so a series of degraders reads the same way
      var c0 = Math.cos(rot), s0 = Math.sin(rot), m1 = 0;
      for (i = 0; i < n; i++) m1 += (w >= h ? c0 * (X[i] - mx) - s0 * (Y[i] - my) : s0 * (X[i] - mx) + c0 * (Y[i] - my)) * M[i];
      if (m1 > 0) rot += Math.PI;
    }
    var c = Math.cos(rot), s = Math.sin(rot), x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < n; i++) { var x = c * X[i] - s * Y[i], y = s * X[i] + c * Y[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return isFinite(x1 - x0) && isFinite(y1 - y0) ? { w: x1 - x0, h: y1 - y0, deg: rot * 180 / Math.PI } : null;
  } catch (e) { return null; }
}
// The scale k of a drawing (k = 1 is 14.4 px for a bond): the one that gives a bond of ACS_BOND_OF_TILE of the tile, or a smaller one when the molecule would not fit.
function acsScale(e, w, h, pad) {
  var kcap = ACS_BOND_OF_TILE * h / ACS_1996.bond; if (!e) return kcap;
  var perUnit = ACS_1996.bond / ACS_UNIT, lab = 0.7 * ACS_1996.font;               // a label sticks out by about 0.35 of its height on each side
  var kx = w * (1 - 2 * pad) / (perUnit * e.w + lab), ky = h * (1 - 2 * pad) / (perUnit * e.h + lab * 1.15);
  return Math.max(0.2, Math.min(kcap, kx, ky));
}
// Options for RDKit's get_svg_with_highlights; the caller adds atoms/bonds/highlightColour when it highlights something.
// A molecule in a set that is aligned (a series on its core in SAR) keeps its orientation: pass keepTurn = true.
function acsOptions(mol, w, h, extra, keepTurn) {
  var pad = 0.05, e = acsExtent(mol, w, h, !keepTurn), k = acsScale(e, w, h, pad), o = {
    width: w, height: h, clearBackground: false, addStereoAnnotation: false, padding: pad,
    fixedBondLength: ACS_1996.bond * k / ACS_UNIT,                                    // RDKit reads this as pixels per coordinate unit, so a bond is ACS_UNIT times it
    bondLineWidth: Math.max(ACS_MIN_LINE, ACS_1996.line * k), scaleBondWidth: false,
    fixedFontSize: Math.max(ACS_MIN_FONT, ACS_1996.font * k), additionalAtomLabelPadding: 0.066, multipleBondOffset: ACS_1996.spacing,
    atomColourPalette: ACS_BLACK, symbolColour: [0, 0, 0]
  };
  if (e && e.deg) o.rotate = e.deg * ACS_TURN_SIGN;
  if (extra) for (var key in extra) o[key] = extra[key];
  return o;
}
// The box of every atom label in an SVG RDKit drew (its glyphs are paths of class atom-N), and whether two of them overlap.
function acsLabelBoxes(svg) {
  var box = {}, re = /<path class='atom-(\d+)'\s+d='([^']*)'/g, m;
  while ((m = re.exec(svg))) {
    var v = m[2].match(/-?\d+\.?\d*/g) || [], b = box[m[1]] || (box[m[1]] = [1e9, 1e9, -1e9, -1e9]);
    for (var i = 0; i + 1 < v.length; i += 2) { var x = +v[i], y = +v[i + 1]; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
  }
  return box;
}
function acsLabelsOverlap(svg) {
  var B = acsLabelBoxes(svg), ids = Object.keys(B), t = 0.4;
  for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) { var a = B[ids[i]], b = B[ids[j]]; if (a[0] < b[2] - t && b[0] < a[2] - t && a[1] < b[3] - t && b[1] < a[3] - t) return true; }
  return false;
}
function acsSvg(mol, w, h, extra, keepTurn) {
  try {
    var o = acsOptions(mol, w, h, extra, keepTurn), svg = mol.get_svg_with_highlights(JSON.stringify(o));
    for (var i = 0; i < 6 && o.fixedFontSize > 2.5 && acsLabelsOverlap(svg); i++) { o.fixedFontSize *= 0.82; svg = mol.get_svg_with_highlights(JSON.stringify(o)); }
    return svg;
  } catch (e) { try { return mol.get_svg(w, h); } catch (e2) { return ''; } }
}
