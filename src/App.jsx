import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * App loads soutez_vysledky.json from its PUBLIC_URL and renders the table.
 * Extras:
 * - URL params:
 *   - scale / zoom: font scaling (default 1.0). e.g. ?scale=1.25 or ?zoom=1.5
 *   - tv: 1/true/yes/on to enable "TV mode" (no scroll, columns)
 *   - cols: optional 1..3 manual column count override for TV mode
 */
export default function App() {
    // -------- URL PARAMS ----------
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const parseBool = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const scaleParam = params.get('scale') ?? params.get('zoom');
    const scale = useMemo(() => {
        const s = Number(scaleParam);
        return clamp(Number.isFinite(s) && s > 0 ? s : 1, 0.5, 3);
    }, [scaleParam]);

    const tvMode = useMemo(() => parseBool(params.get('tv')), [params]);
    const colsOverrideRaw = useMemo(() => {
        const c = parseInt(params.get('cols') || params.get('columns') || '', 10);
        return Number.isFinite(c) ? clamp(c, 1, 3) : null;
    }, [params]);

    // -------- DATA LOADING ----------
    const [data, setData] = useState({}); // expects { cps_year, updated_at, pilots_info: [...] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const publicUrl = process.env?.PUBLIC_URL || '';

    useEffect(() => {
        const url = `${publicUrl.replace(/\/$/, '')}/soutez_vysledky.json`;
        fetch(url, { cache: 'no-store' })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => setData(json))
            .catch((e) => setError(e.message || String(e)))
            .finally(() => setLoading(false));
    }, [publicUrl]);

    const pilots = useMemo(() => {
        const pilots_info = Array.isArray(data?.pilots_info) ? data.pilots_info : [];
        return [...pilots_info].sort(
            (a, b) => (b?.sum_of_points ?? 0) - (a?.sum_of_points ?? 0)
        );
    }, [data]);

    const [layout, setLayout] = useState({
        columns: 1,
        rowsPerCol: Infinity,
        showRulesInMonitor: false,
    });

    const year = data?.cps_year || new Date().getFullYear();
    const updatedAt = data?.updated_at || '';

    // -------- MONITOR MODE LAYOUT (no scroll, columns) ----------
    const containerRef = useRef(null);
    const headerRef = useRef(null);
    const theadMeasureRef = useRef(null);
    const rowMeasureRef = useRef(null);
    const rulesMeasureRef = useRef(null);

    // add/remove no-scroll on body in TV mode
    useEffect(() => {
        if (tvMode) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [tvMode]);

    // recompute layout on resize / data / scale / tvMode
    useLayoutEffect(() => {
        if (!tvMode) return;

        const compute = () => {
            const cont = containerRef.current;
            const head = headerRef.current;
            const theadBox = theadMeasureRef.current?.getBoundingClientRect();
            const rowBox = rowMeasureRef.current?.getBoundingClientRect();
            const rulesBox = rulesMeasureRef.current?.getBoundingClientRect();

            const contH = cont?.clientHeight || window.innerHeight;
            const contW = cont?.clientWidth || window.innerWidth;
            const headerH = head?.getBoundingClientRect()?.height || 0;
            const theadH = theadBox?.height || 44; // fallback estimate
            const rowH = rowBox?.height || 44;     // fallback estimate
            const rulesH = rulesBox?.height || 0;

            // auto columns if not overridden: up to 3 columns on extra large monitors.
            const minColWidth = 520 * scale; // tuned for Bootstrap table; scales with font size
            const autoCols = clamp(Math.floor(contW / minColWidth), 1, 3);
            const columns = colsOverrideRaw || autoCols;

            // available height for table rows within a column (per column has its own thead)
            const availableH = contH - headerH - theadH - 16; // small safety margin
            const rowsPerCol = Math.max(0, Math.floor(availableH / rowH));

            // how many rows will actually be shown overall
            const maxRows = rowsPerCol * columns;
            const shown = Math.min(maxRows, pilots.length);

            // rows placed in last column
            const rowsBeforeLast = Math.max(0, rowsPerCol * (columns - 1));
            const rowsInLast = Math.max(0, Math.min(rowsPerCol, shown - rowsBeforeLast));

            // remaining space in last column for rules
            const leftoverPx = availableH - rowsInLast * rowH;

            const showRulesInMonitor = leftoverPx >= (rulesH + 8) && rulesH > 0;

            setLayout({ columns, rowsPerCol, showRulesInMonitor });
        };

        compute();
        const ro = new ResizeObserver(() => compute());
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', compute);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', compute);
        };
    }, [tvMode, pilots.length, scale, colsOverrideRaw]);

    // -------- RENDER HELPERS ----------
    const TitleBlock = () => (
        <>
            <h1 style={{ fontSize: `calc(${scale} * 2.5rem)` }}>AK Medlánky - Klubová soutěž {year}</h1>
            {updatedAt ? <p>Aktualizováno: {updatedAt}</p> : null}
        </>
    );

    const TableHead = React.memo(() => (
        <thead>
        <tr>
            <th>#</th>
            <th>Jméno</th>
            <th>Rok</th>
            <th colSpan="4">4 nejlepší lety</th>
            <th>Celkem</th>
        </tr>
        </thead>
    ));

    const PilotRow = ({ pilot, idx }) => {
        const flights = Array.isArray(pilot?.top_4_lkcm_flights) ? pilot.top_4_lkcm_flights : [];
        const nejlepsi = [...flights].slice(0, 4);
        while (nejlepsi.length < 4) nejlepsi.push(null);

        return (
            <tr key={pilot?.url ?? pilot?.name ?? idx}>
                <td>{idx + 1}</td>
                <td className="td-ellipsis">
                    {pilot?.url ? (
                        <a
                            href={pilot.url}
                            target="_blank"
                            rel="noreferrer"
                            className="cell-block"
                            title={pilot?.name ?? ''}
                        >
                            {pilot?.name ?? '—'}
                        </a>
                    ) : (
                        <span className="cell-block" title={pilot?.name ?? ''}>
                          {pilot?.name ?? '—'}
                        </span>
                    )}
                </td>
                <td>{pilot?.year_of_birth ?? '—'}</td>
                {nejlepsi.map((f, i) => (
                    <td key={i}>
                        {f ? (
                            <a href={f.url} title={f.date} target="_blank" rel="noreferrer">
                                <b>{f.points}</b>
                                <span style={{ fontSize: '0.6em' }}>&nbsp;b</span>
                            </a>
                        ) : (
                            ''
                        )}
                    </td>
                ))}
                <td>
                    <b>{pilot?.sum_of_points ?? 0}</b>
                    <span style={{ fontSize: '0.6em' }}>&nbsp;b</span>
                </td>
            </tr>
        );
    };

    const RulesBlock = React.memo(() => (
        <>
            <h3 style={{ fontSize: `calc(${scale} * 1.75rem)` }}>Pravidla</h3>
            <ul className="mb-0">
                <li>započítává lety z CPS – modré i šedé body</li>
                <li>
                    započítává pouze lety, které mají startovní pásku maximálně ve vzdálenosti
                    20&nbsp;km od vztažného bodu LKCM
                </li>
                <li>každému pilotovi se započítávají 4 nejlepší lety v daném roce</li>
            </ul>
        </>
    ));

    // -------- LOADING / ERROR ----------
    if (loading) {
        return (
            <div
                ref={containerRef}
                className="container-fluid ml-2 mr-2 mt-3"
                style={{ fontSize: `${16 * scale}px` }}
            >
                <TitleBlock />
                <p>Načítám data…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                ref={containerRef}
                className="container-fluid ml-2 mr-2 mt-3"
                style={{ fontSize: `${16 * scale}px` }}
            >
                <TitleBlock />
                <div className="alert alert-danger" role="alert">
                    Nepodařilo se načíst <code>soutez_vysledky.json</code> ({error}).
                </div>
                <p>
                    Ujisti se, že je soubor dostupný na adrese:{' '}
                    <code>{publicUrl}/soutez_vysledky.json</code> a že server vrací platný JSON.
                </p>
            </div>
        );
    }

    // -------- NORMAL MODE (scrollable, původní tabulka) ----------
    if (!tvMode) {
        return (
            <div
                ref={containerRef}
                className="container-fluid ml-2 mr-2 mt-3"
                style={{ fontSize: `${16 * scale}px` }}
            >
                <TitleBlock />

                <div className="row">
                    <div className="col-xl-6 col-lg-8 col-md-10">
                        <table className="table table-striped table-fixed">
                            <colgroup>
                                <col style={{ width: '6%' }} />{/* # */}
                                <col />{/* Jméno (flex) */}
                                <col style={{ width: '9%' }} />{/* Rok */}
                                <col style={{ width: '11%' }} />{/* Let 1 */}
                                <col style={{ width: '11%' }} />{/* Let 2 */}
                                <col style={{ width: '11%' }} />{/* Let 3 */}
                                <col style={{ width: '11%' }} />{/* Let 4 */}
                                <col style={{ width: '13%' }} />{/* Celkem */}
                            </colgroup>
                            <TableHead />
                            <tbody>
                            {pilots.map((pilot, idx) => (
                                <PilotRow key={pilot?.url ?? pilot?.name ?? idx} pilot={pilot} idx={idx} />
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr />
                <RulesBlock />
            </div>
        );
    }

    // -------- MONITOR MODE (no scroll, 1-3 columns, oříznutí zbytku) ----------
    // připravit řezy do sloupců
    const { columns, rowsPerCol, showRulesInMonitor } = layout;
    const maxRows = rowsPerCol * columns;
    const shown = pilots.slice(0, maxRows);

    const columnSlices = Array.from({ length: columns }, (_, i) =>
        shown.slice(i * rowsPerCol, (i + 1) * rowsPerCol)
    );

    return (
        <div
            ref={containerRef}
            className="container-fluid ml-2 mr-2 mt-3"
            style={{
                fontSize: `${16 * scale}px`,
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* header area (measured) */}
            <div ref={headerRef} style={{ flex: '0 0 auto' }}>
                <TitleBlock />
            </div>

            {/* columns area */}
            <div
                className="d-flex"
                style={{
                    flex: '1 1 auto',
                    gap: '1rem',
                    overflow: 'hidden',
                }}
            >
                {columnSlices.map((slice, colIdx) => (
                    <div
                        key={`col-${colIdx}`}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ overflow: 'hidden' }}>
                            <table className="table table-striped mb-0 table-fixed">
                                <colgroup>
                                    <col style={{ width: '6%' }} />{/* # */}
                                    <col />{/* Jméno (flex) */}
                                    <col style={{ width: '9%' }} />{/* Rok */}
                                    <col style={{ width: '11%' }} />{/* Let 1 */}
                                    <col style={{ width: '11%' }} />{/* Let 2 */}
                                    <col style={{ width: '11%' }} />{/* Let 3 */}
                                    <col style={{ width: '11%' }} />{/* Let 4 */}
                                    <col style={{ width: '13%' }} />{/* Celkem */}
                                </colgroup>
                                <TableHead />
                                <tbody>
                                {slice.map((pilot, idx) => (
                                    <PilotRow
                                        key={pilot?.url ?? pilot?.name ?? `${colIdx}-${idx}`}
                                        pilot={pilot}
                                        idx={colIdx * rowsPerCol + idx}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* V posledním sloupci zobraz pravidla, pokud se vejdou */}
                        {colIdx === columnSlices.length - 1 && showRulesInMonitor ? (
                            <div className="mt-3">
                                <hr className="my-2" />
                                <RulesBlock />
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Měřicí prvky (neviditelné, ale ve flow, aby se počítaly správné výšky se scale) */}
            <div style={{ position: 'absolute', visibility: 'hidden', left: -9999, top: 0 }}>
                <table className="table table-striped mb-0 table-fixed">
                    <colgroup>
                        <col style={{ width: '6%' }} />{/* # */}
                        <col />{/* Jméno (flex) */}
                        <col style={{ width: '9%' }} />{/* Rok */}
                        <col style={{ width: '11%' }} />{/* Let 1 */}
                        <col style={{ width: '11%' }} />{/* Let 2 */}
                        <col style={{ width: '11%' }} />{/* Let 3 */}
                        <col style={{ width: '11%' }} />{/* Let 4 */}
                        <col style={{ width: '13%' }} />{/* Celkem */}
                    </colgroup>
                    <thead ref={theadMeasureRef}>
                    <tr>
                        <th>#</th>
                        <th>Jméno</th>
                        <th>Rok</th>
                        <th colSpan="4">4 nejlepší lety</th>
                        <th>Celkem</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr ref={rowMeasureRef}>
                        <td>99</td>
                        <td className="td-ellipsis">
                            <a
                                href="#x"
                                target="_blank"
                                rel="noreferrer"
                                className="cell-block"
                            >
                                Měřicí Pilot S Extra Dlouhým Jménem Které Se Jinak Zalamuje
                            </a>

                        </td>
                        <td>1999</td>
                        <td>
                            <a href="#x" title="2025-01-01">
                                <b>999.9</b>
                                <span style={{ fontSize: '0.6em' }}>&nbsp;b</span>
                            </a>
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>
                            <b>9999.9</b>
                            <span style={{ fontSize: '0.6em' }}>&nbsp;b</span>
                        </td>
                    </tr>
                    </tbody>
                </table>

                <div ref={rulesMeasureRef} style={{ width: 520 }}>
                    {/* stejný markup jako RulesBlock */}
                    <h3 style={{ fontSize: `calc(${scale} * 1.75rem)` }}>Pravidla</h3>
                    <ul className="mb-0">
                        <li>započítává lety z CPS – modré i šedé body</li>
                        <li>
                            započítává pouze lety, které mají startovní pásku maximálně ve vzdálenosti
                            20&nbsp;km od vztažného bodu LKCM
                        </li>
                        <li>každému pilotovi se započítávají 4 nejlepší lety v daném roce</li>
                    </ul>
                </div>
            </div>

            {/* Globální style */}
            <style>{`
                /* pro no-scroll režim */
                body.no-scroll { overflow: hidden; }
                @media (max-width: 768px) {
                  /* v malých šířkách raději jen 1 sloupec (řeší autoCols výpočet) */
                }
      
              .table-fixed { table-layout: fixed; width: 100%; }
              .td-ellipsis {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
              .cell-block {
                display: block;
                width: 100%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
            `}</style>
        </div>
    );
}
