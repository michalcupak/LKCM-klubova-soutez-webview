import React, { useEffect, useMemo, useState } from 'react';

/**
 * App loads pilots_info.json from its PUBLIC_URL and renders the table
 * corresponding to the originally concatenated HTML.
 */
export default function App1() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine base URL (CRA: process.env.PUBLIC_URL). Fallback to empty string.
  const publicUrl = (typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL) ? process.env.PUBLIC_URL : '';

  useEffect(() => {
    const url = `${publicUrl.replace(/\/$/, '')}/soutez_vysledky.json`;
    fetch(url, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData( json /*Array.isArray(json) ? json : []*/))
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [publicUrl]);

  const sorted = useMemo(() => {
      console.log(data);
      const pilots_info = data?.pilots_info || [];
    return [...pilots_info].sort((a, b) => ((b?.sum_of_points ?? 0) - (a?.sum_of_points ?? 0)));
  }, [data]);

  if (loading) {
    return (
      <div className="container-fluid ml-2 mr-2 mt-3">
        <h1>AK Medlánky - Klubová soutěž {data.cps_year}</h1>
        <p>Načítám data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid ml-2 mr-2 mt-3">
        <h1>AK Medlánky - Klubová soutěž {data.cps_year}</h1>
        <div className="alert alert-danger" role="alert">
          Nepodařilo se načíst <code>soutez_vysledky.json</code> ({error}).
        </div>
        <p>
          Ujisti se, že je soubor dostupný na adrese: <code>{publicUrl}/soutez_vysledky.json</code>
          {' '}a že server vrací platný JSON.
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid ml-2 mr-2 mt-3">
      <h1>AK Medlánky - Klubová soutěž {data.cps_year}</h1>
      <p>Aktualizováno: {data.updated_at}</p>

      <div className="row">
        <div className="col-xl-6 col-lg-8 col-md-10">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Jméno</th>
                <th>Rok</th>
                <th colSpan="4">4 nejlepší lety</th>
                <th>Celkem</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pilot, idx) => {
                const flights = Array.isArray(pilot?.top_4_lkcm_flights) ? pilot.top_4_lkcm_flights : [];
                const nejlepsi = [...flights].slice(0, 4);
                while (nejlepsi.length < 4) nejlepsi.push(null);

                return (
                  <tr key={pilot?.url ?? pilot?.name ?? idx}>
                    <td>{idx + 1}</td>
                    <td>
                      {pilot?.url ? (
                        <a href={pilot.url} target="_blank" rel="noreferrer">{pilot?.name ?? '—'}</a>
                      ) : (
                        pilot?.name ?? '—'
                      )}
                    </td>
                    <td>{pilot?.year_of_birth ?? '—'}</td>

                    {nejlepsi.map((f, i) => (
                      <td key={i}>
                        {f ? (
                          <a href={f.url} title={f.date} target="_blank" rel="noreferrer">
                            <b>{f.points}</b><span style={{ fontSize: '0.6rem' }}>&nbsp;b</span>
                          </a>
                        ) : ''}
                      </td>
                    ))}

                    <td>
                      <b>{pilot?.sum_of_points ?? 0}</b>
                      <span style={{ fontSize: '0.6rem' }}>&nbsp;b</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <hr />
      <h3>Pravidla</h3>
      <ul>
        <li>započítává lety z CPS – modré i šedé body</li>
        <li>započítává pouze lety, které mají startovní pásku maximálně ve vzdálenosti 20&nbsp;km od vztažného bodu LKCM</li>
        <li>každému pilotovi se započítávají 4 nejlepší lety v daném roce</li>
      </ul>
    </div>
  );
}
