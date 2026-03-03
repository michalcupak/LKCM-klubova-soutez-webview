import React from "react";
import {Modal} from "react-bootstrap";

const TableHead = React.memo(() => (
    <thead>
    <tr>
        <th>#</th>
        <th>Jméno</th>
        <th>Rok</th>
        <th>Datum</th>
        <th>Kluzák</th>
        <th>Trať</th>
        <th>Body</th>
    </tr>
    </thead>
));

const FlightRow = ({ flight, idx }) => {
    const pilotName = flight?.pilot ?? "—";
    const pilot_year_of_birth = flight?.pilot_year_of_birth ?? "—";
    const pilot_url = flight?.pilot_url;
    const date = flight?.date ?? "—";
    const glider_name = flight?.glider_name ?? "—";
    const task = (() => {
        if (typeof flight?.task_shape !== "string" || typeof flight?.task_distance_km !== "number") {
            return <span className="text-muted">—</span>;
        }
        return (
            <span>{flight.task_shape.split(" ")[0]}{" "} {Math.round(flight.task_distance_km)}&nbsp;km</span>
        );
    })();
    const points =
        typeof flight?.points === "number" ? flight.points : flight?.points ?? "—";
    const url = flight?.url;

    return (
        <tr>
            <td>{idx + 1}</td>

            <td className="td-ellipsis">
                {pilot_url ? (
                    <a
                        href={pilot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="cell-block"
                        title={pilotName}
                    >
                        {pilotName}
                    </a>
                ) : (
                    <span className="cell-block" title={pilotName}>
                        {pilotName}
                    </span>
                )}
            </td>

            <td>{pilot_year_of_birth}</td>

            <td>{date}</td>

            <td>{glider_name}</td>

            <td>{task}</td>

            <td>
                {url ? (
                    <a href={url} title={date} target="_blank" rel="noreferrer">
                        <b>{points}</b>
                        <span style={{ fontSize: "0.6em" }}>&nbsp;b</span>
                    </a>
                ) : (
                    <>
                        <b>{points}</b>
                        <span style={{ fontSize: "0.6em" }}>&nbsp;b</span>
                    </>
                )}
            </td>
        </tr>
    );
};

const CompetitionTable = ({ categoryKey, categoryDesc, flights, categoryDescMore, categoryDescMoreLabel="zobrazit vše" }) => {
    const all = Array.isArray(flights) ? flights : [];
    const [showAll, setShowAll] = React.useState(false);
    const [showDescMore, setShowDescMore] = React.useState(false);

    const limit = 5;
    const visible = showAll ? all : all.slice(0, limit);
    const hasMore = all.length > limit;

    return (
        <>
            <h4 className="mb-1 ">{categoryKey}</h4>

            <div className="col-xl-8 col-lg-10 col-md-12 mb-2 d-flex align-items-baseline">
                <small className="me-2">{categoryDesc}</small>
                {categoryDescMore && (
                    <button
                        type="button"
                        className="btn btn-link btn-sm p-0 ml-auto text-nowrap"
                        onClick={() => setShowDescMore(true)}
                    >
                        <small>{categoryDescMoreLabel}</small>
                    </button>
                )}
            </div>

            {showDescMore && (
                <Modal show={showDescMore} onHide={() => setShowDescMore(false)} centered animation={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>{categoryKey} - zúčastněné typy</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {Array.isArray(categoryDescMore) ?
                            <ul>
                                {categoryDescMore.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            :
                            categoryDescMore
                        }
                    </Modal.Body>
                </Modal>
            )}

            <div className="row">
                <div className="col-xl-8 col-lg-10 col-md-12">
                    <table className="table table-striped table-fixed mb-0">
                        <colgroup>
                            <col style={{ width: "8%" }} />{/* # */}
                            <col />{/* Jméno (flex) */}
                            <col style={{ width: '9%' }} />{/* Rok */}
                            <col style={{ width: "13%" }} />{/* Datum */}
                            <col style={{ width: "18%" }} />{/* Kluzak */}
                            <col style={{ width: "20%" }} />{/* Trat */}
                            <col style={{ width: "11%" }} />{/* Body */}
                        </colgroup>

                        <TableHead />

                        <tbody>
                        {visible.map((flight, idx) => (
                            <FlightRow
                                key={
                                    flight?.url ??
                                    `${flight?.pilot ?? "pilot"}-${flight?.date ?? "date"}-${idx}`
                                }
                                flight={flight}
                                idx={idx}
                            />
                        ))}
                        </tbody>
                    </table>

                    {hasMore && !showAll && (
                        <button
                            type="button"
                            className="btn btn-link _btn-outline-primary btn-sm"
                            onClick={() => setShowAll(true)}
                        >
                            Zobrazit vše
                        </button>
                    )}

                    {hasMore && showAll && (
                        <button
                            type="button"
                            className="btn btn-link _btn-outline-secondary btn-sm"
                            onClick={() => setShowAll(false)}
                        >
                            Skrýt
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

/**
 * Vykreslí všechny kategorie z JSON objektu:
 *  - očekává tvar { open: [...], club: [...], ... }
 *  - každá kategorie použije CompetitionTable
 */
const CompetitionsTables = ({ data, descriptions, descriptions_more, descriptions_more_label, order }) => {
    const obj = data && typeof data === "object" && !Array.isArray(data) ? data : {};

    // pořadí: buď uživatel zadá (order), nebo vezmeme jak jsou serazene v objektu
    const keys = Array.isArray(order)
        ? order.filter((k) => k in obj)
        : Object.keys(obj);

    // vyfiltruj prázdné / neplatné položky (volitelné)
    const categories = keys
        .map((k) => ({ key: k, flights: Array.isArray(obj[k]) ? obj[k] : [] }))
        .filter((c) => c.flights.length > 0);

    if (categories.length === 0) return null;

    return (
        <>
            {categories.map(({ key, flights }) => (
                <div key={key} className="mb-5">
                    <CompetitionTable
                        categoryKey={key}
                        flights={flights}
                        categoryDesc={descriptions ? descriptions[key] : ""}
                        categoryDescMore={descriptions_more ? descriptions_more[key] : null}
                        categoryDescMoreLabel={descriptions_more_label}
                    />
                </div>
            ))}
        </>
    );
};

export default CompetitionsTables;

// Exporty navíc, kdybys chtěl používat samostatně:
export { CompetitionTable };
