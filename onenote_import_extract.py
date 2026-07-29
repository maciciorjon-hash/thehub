#!/usr/bin/env python3
"""
One-off extraction script: turns Jon's OneNote-exported PDF into a structured
import bundle (onenote_import.json + images/) that Labbook's "Import notebook"
feature can load. Not part of the shipped app — run manually, once.

Usage: python3 onenote_import_extract.py "/path/to/Notebook.pdf" "/path/to/output_dir"
"""
import sys, os, re, json, unicodedata

import fitz  # pymupdf

FOOTER_RE = re.compile(r'^(.*?)\s+Page\s+(\d+)\s*$')
TIME_RE = re.compile(r'^\d{1,2}:\d{2}$')
DATE_RE = re.compile(
    r'^(?:[A-Za-z]+,\s*)?\d{1,2}\s+[A-Za-z]+\s+\d{4}$'
)
# OneNote's own bullet-marker glyphs appear as their own line, positioned
# *after* the item they mark (a text-extraction-order quirk, not a real
# nesting error) — map glyph -> nesting depth.
BULLET_DEPTH = {'•': 1, '○': 2, '▪': 3, '‣': 1, '◦': 2}
CHECK_GLYPHS = {'✓', '✔'}


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;')
             .replace('>', '&gt;').replace('"', '&quot;'))


def safe_slug(name):
    n = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    n = re.sub(r'[^A-Za-z0-9]+', '_', n).strip('_')
    return n or 'section'


def split_footer(lines):
    """Return (content_lines, section_name, page_num) or (lines, None, None)."""
    nb_idx = [i for i, l in enumerate(lines) if l.strip() != '']
    if not nb_idx:
        return lines, None, None
    last = lines[nb_idx[-1]].strip()
    m = FOOTER_RE.match(last)
    if not m:
        return lines, None, None
    section = m.group(1).strip()
    pagenum = int(m.group(2))
    content = lines[:nb_idx[-1]]
    return content, section, pagenum


def extract_title_meta(lines):
    """Pull trailing title/date/time off the content lines (in that order,
    scanning from the bottom since OneNote's title box prints last).

    Not every OneNote page has this metadata block (some pages are pure
    continuation content with no title/date at all) — anchor on the date
    line specifically, since it's the only one of the three with an
    unambiguous format. Only consume a title/time line if a real date was
    actually found; otherwise leave every line as body content rather than
    risk eating a bullet/continuation line as if it were a title.
    """
    idx = [i for i, l in enumerate(lines) if l.strip() != '']
    if not idx:
        return lines, None, None, None
    j = len(idx) - 1
    time_candidate_j = j - 1 if TIME_RE.match(lines[idx[j]].strip()) else j
    if time_candidate_j >= 0 and DATE_RE.match(lines[idx[time_candidate_j]].strip()):
        date_line = lines[idx[time_candidate_j]].strip()
        time_line = lines[idx[j]].strip() if time_candidate_j != j else None
        title_j = time_candidate_j - 1
        title_line = lines[idx[title_j]].strip() if title_j >= 0 else None
        body_end = idx[title_j] + 1 if title_j >= 0 else 0
    else:
        date_line = time_line = title_line = None
        body_end = len(lines)
    body_lines = lines[:body_end]
    return body_lines, title_line, date_line, time_line


def body_to_html(lines):
    """Turn OneNote's flat bullet-glyph text into indented paragraphs.

    OneNote's print-to-PDF emits each bullet's own marker glyph *after* that
    bullet's text and all of its (already-closed) children — a proper tree
    would need position/font data to reconstruct exactly, which flat text
    extraction doesn't reliably give (a wrapped multi-line sentence and two
    separate not-yet-closed sibling bullets can look identical). Rather than
    risk mis-nested <ul>/<li> HTML (or silently losing text to a wrong merge)
    across 836 pages of varied structure, every run of lines up to its
    closing glyph becomes one indented paragraph — all text is preserved,
    just occasionally grouped one level less granularly than the original.
    """
    items = []          # (depth_or_'p', text)
    pending = []        # buffered plain-text lines awaiting a bullet marker
    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if s in BULLET_DEPTH:
            depth = BULLET_DEPTH[s]
            text = ' '.join(pending).strip()
            pending = []
            if text:
                items.append((depth, text))
            continue
        if s in CHECK_GLYPHS:
            text = ' '.join(pending).strip()
            pending = []
            if text:
                items.append(('check', text))
            continue
        pending.append(s)
    if pending:
        items.append(('p', ' '.join(pending).strip()))

    if not items:
        return '<p></p>'

    html = []
    for kind, text in items:
        if kind == 'p':
            html.append('<p>' + esc(text) + '</p>')
        elif kind == 'check':
            html.append('<p style="margin-left:20px">&#9744; ' + esc(text) + '</p>')
        else:
            indent = 20 * kind
            marker = {1: '&#8226;', 2: '&#9702;', 3: '&#9642;'}.get(kind, '&#8226;')
            html.append('<p style="margin-left:' + str(indent) + 'px">' + marker + ' ' + esc(text) + '</p>')
    return '\n'.join(html)


def parse_date_time(date_line, time_line):
    # Best-effort: Labbook wants an ISO yyyy-mm-dd string; keep raw text as a
    # fallback note if it doesn't parse cleanly.
    if not date_line:
        return None
    m = re.match(r'^(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$', date_line)
    if not m:
        return None
    day, monname, year = m.group(1), m.group(2), m.group(3)
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
              'august', 'september', 'october', 'november', 'december']
    try:
        mi = months.index(monname.lower()) + 1
    except ValueError:
        return None
    return f'{int(year):04d}-{mi:02d}-{int(day):02d}'


def main():
    if len(sys.argv) < 3:
        print('Usage: onenote_import_extract.py <pdf_path> <output_dir>')
        sys.exit(1)
    pdf_path, out_dir = sys.argv[1], sys.argv[2]
    img_dir = os.path.join(out_dir, 'onenote_import_images')
    os.makedirs(img_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    sections = {}  # name -> list of page dicts, in first-seen order
    unmatched = []
    total_images = 0

    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text()
        lines = text.split('\n')
        content, section, pagenum = split_footer(lines)
        if section is None:
            unmatched.append(i)
            section = 'Unsorted'
        body_lines, title, date_line, time_line = extract_title_meta(content)
        html = body_to_html(body_lines)
        iso_date = parse_date_time(date_line, time_line)

        images = []
        scale = 700.0 / page.rect.width if page.rect.width else 1.0
        for k, im in enumerate(page.get_image_info(xrefs=True)):
            xref = im.get('xref')
            if not xref:
                continue
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            # Skip OneNote's tiny placeholder/background glyphs (e.g. 25x25,
            # 32x32 blank icons) — not real content, just extraction noise.
            if min(base.get('width', 0), base.get('height', 0)) < 48:
                continue
            ext = base.get('ext', 'png')
            fname = f'p{i+1:04d}_{k}.{ext}'
            with open(os.path.join(img_dir, fname), 'wb') as f:
                f.write(base['image'])
            bx0, by0, bx1, by1 = im['bbox']
            images.append({
                'file': fname,
                'x': round(bx0 * scale, 1),
                'y': round(by0 * scale, 1),
                'w': round(max(40.0, (bx1 - bx0) * scale), 1),
                'h': round(max(30.0, (by1 - by0) * scale), 1),
            })
            total_images += 1

        page_list = sections.setdefault(section, [])
        if title is None and page_list:
            # No title/date found: this PDF page is a continuation of the
            # previous OneNote page overflowing onto a new PDF page, not a
            # separate note — merge it in rather than fragmenting one long
            # entry into several near-empty "Untitled" Labbook pages.
            prev = page_list[-1]
            merge_n = prev.get('_mergeCount', 0) + 1
            prev['_mergeCount'] = merge_n
            prev['html'] += '\n<p>&nbsp;</p>\n' + html
            for im in images:
                im['y'] = round(im['y'] + 420.0 * merge_n, 1)
                prev['images'].append(im)
        else:
            page_list.append({
                'sourcePage': i + 1,
                'title': title or f'Page {pagenum}',
                'date': iso_date,
                'dateRaw': date_line,
                'time': time_line,
                'html': html,
                'images': images,
            })

    for pages in sections.values():
        for p in pages:
            p.pop('_mergeCount', None)

    bundle = {
        'sourcePdf': os.path.basename(pdf_path),
        'totalPdfPages': doc.page_count,
        'sections': [
            {'name': name, 'pages': pages} for name, pages in sections.items()
        ],
    }

    out_json = os.path.join(out_dir, 'onenote_import.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, ensure_ascii=False, indent=1)

    print(f'Pages processed: {doc.page_count}')
    print(f'Sections found: {len(sections)}')
    for name, pages in sections.items():
        print(f'  {name!r}: {len(pages)} pages')
    print(f'Unmatched-footer pages: {len(unmatched)} {unmatched[:20]}')
    print(f'Images extracted: {total_images}')
    print(f'Bundle written: {out_json}')
    print(f'Images dir: {img_dir}')


if __name__ == '__main__':
    main()
