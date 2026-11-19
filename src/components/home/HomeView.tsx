"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import Icon from "../Icon";
import Logo from "../Logo";
import type { IconName } from "../icons";
import { COMMS, ME, POSTS0, T, type Post } from "../../lib/seed";

const BN: { k: string; icon: IconName; label: string }[] = [
  { k: "home", icon: "home", label: "Inicio" },
  { k: "comms", icon: "users", label: "Comunidades" },
  { k: "live", icon: "live", label: "En vivo" },
  { k: "market", icon: "store", label: "Mercado" },
  { k: "profile", icon: "user", label: "Perfil" },
];

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return src ? (
    <img className="av" src={src} alt="" />
  ) : (
    <div className="av">{name.charAt(0).toUpperCase()}</div>
  );
}

function Follow() {
  const [on, setOn] = useState(false);
  return (
    <button className="b2 sg" onClick={() => setOn(true)}>
      {on ? "Siguiendo" : "Seguir"}
    </button>
  );
}

export default function HomeView() {
  const [posts, setPosts] = useState<Post[]>(POSTS0);
  const [text, setText] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [dest, setDest] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [tab, setTab] = useState("home");
  const [msg, setMsg] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const members = COMMS.reduce((a, c) => a + c.m, 0) + 1;

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 3200);
  }

  function compose() {
    setTab("home");
    window.scrollTo(0, 0);
    taRef.current?.focus();
  }

  function pickImage(file: File) {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 640 / im.width);
        const c = document.createElement("canvas");
        c.width = im.width * k;
        c.height = im.height * k;
        c.getContext("2d")?.drawImage(im, 0, 0, c.width, c.height);
        setImg(c.toDataURL("image/jpeg", 0.7));
      };
      im.src = String(r.result);
    };
    r.readAsDataURL(file);
  }

  function publish() {
    const t = text.trim();
    if (!t && !img) return flash("Escribe algo o adjunta un archivo.");
    const np: Post = {
      id: Date.now(),
      n: ME.n,
      vf: false,
      t,
      img,
      c: dest,
      l: 0,
      s: 0,
      cm: [],
      when: "ahora",
      mine: true,
    };
    setPosts((ps) => [np, ...ps]);
    setText("");
    setImg(null);
  }

  const like = (id: number) =>
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, l: p.l + 1 } : p)));

  function share(id: number) {
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, s: p.s + 1 } : p)));
    try {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    } catch {}
    flash(T.compartida);
  }

  function addComment(id: number) {
    const t = (drafts[id] ?? "").trim();
    if (!t) return;
    setPosts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, cm: [...p.cm, { n: ME.n, t }] } : p))
    );
    setDrafts((d) => ({ ...d, [id]: "" }));
  }

  function body(p: Post) {
    const c = COMMS.find((x) => x.id === p.c);
    const locked = !!c && c.p > 0 && !p.mine;
    if (locked && c) {
      return (
        <div className="lk">
          <Icon name="lock" />
          <p>
            Contenido exclusivo para suscriptores de <b>{c.n}</b>
          </p>
          <button className="b" onClick={() => flash(T.subPronto)}>
            Suscribirme{T.dot}US${c.p}/mes
          </button>
        </div>
      );
    }
    if (p.img) {
      return (
        <>
          <div className="pm">
            <img src={p.img} alt="" />
          </div>
          <p className="cp">{p.t}</p>
        </>
      );
    }
    return (
      <div className="pz">
        <p>{p.t}</p>
        <small>Selah</small>
      </div>
    );
  }

  function card(p: Post) {
    const c = COMMS.find((x) => x.id === p.c);
    return (
      <article className="pp" key={p.id}>
        <div className="ph">
          <Avatar name={p.n} src={p.mine ? ME.av : null} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{p.n}</b>
            {p.vf && <Icon name="shield" className="vf" />}
            <small>
              {p.when}
              {c ? T.dot + c.n : ""}
            </small>
          </div>
          {!p.mine && <Follow />}
          <button
            className="mo"
            aria-label="Reportar"
            onClick={() => flash(T.reporte)}
          >
            <Icon name="dots" />
          </button>
        </div>
        {body(p)}
        <div className="ac">
          <button onClick={() => like(p.id)}>
            <Icon name="heart" /> {p.l}
          </button>
          <button onClick={() => setOpen(open === p.id ? null : p.id)}>
            <Icon name="chat" /> {p.cm.length}
          </button>
          <button onClick={() => share(p.id)}>
            <Icon name="share" /> {p.s}
          </button>
        </div>
        <div id={`c${p.id}`}>
          {open === p.id && (
            <>
              {p.cm.map((c2, i) => (
                <p className="cm" key={i}>
                  <b>{c2.n}</b> {c2.t}
                </p>
              ))}
              <div className="row" style={{ marginTop: 8 }}>
                <input
                  placeholder="Escribe un comentario respetuoso"
                  value={drafts[p.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                  }
                />
                <button className="b" onClick={() => addComment(p.id)}>
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      <div className="ap">
        <header className="tb">
          <button
            aria-label="Notificaciones"
            onClick={() => flash("No tienes notificaciones nuevas.")}
          >
            <Icon name="bell" />
            <i className="dot" />
          </button>
          <div className="lg">
            <Logo size={30} />
            Selah
          </div>
          <div className="ct">
            <Icon name="users" /> {members}
          </div>
        </header>

        {tab === "home" && (
          <div className="st">
            <button onClick={compose}>
              <div className="rg me">
                <div>
                  {ME.av ? (
                    <img
                      src={ME.av}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    ME.n.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <span>Tu historia</span>
            </button>
            {COMMS.map((c) => (
              <button key={c.id} onClick={() => setTab("comms")}>
                <div className="rg">
                  <div>{c.n.charAt(0)}</div>
                </div>
                <span>{c.n}</span>
              </button>
            ))}
          </div>
        )}

        <main>
          {tab === "home" ? (
            <>
              <div className="cd">
                <textarea
                  ref={taRef}
                  rows={3}
                  placeholder={T.placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div>
                  {img && (
                    <div className="mw">
                      <img src={img} alt="" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickImage(f);
                    e.target.value = "";
                  }}
                />
                <div className="row">
                  <button className="b2" onClick={() => fileRef.current?.click()}>
                    <Icon name="img" /> Imagen
                  </button>
                  <button className="b2" onClick={() => flash(T.videoPronto)}>
                    <Icon name="video" /> Video
                  </button>
                  <select
                    aria-label="Destino"
                    value={dest}
                    onChange={(e) => setDest(Number(e.target.value))}
                  >
                    <option value={0}>{T.publico}</option>
                  </select>
                  <button
                    className="b"
                    style={{ marginLeft: "auto" }}
                    onClick={publish}
                  >
                    Publicar
                  </button>
                </div>
              </div>
              {posts.map(card)}
            </>
          ) : (
            <div className="cd">
              <h2>{BN.find((n) => n.k === tab)?.label}</h2>
              <p className="mu">{T.pronto}</p>
            </div>
          )}
        </main>
      </div>

      <button className="fab" aria-label="Publicar" onClick={compose}>
        <Icon name="plus" />
      </button>
      <nav className="bt">
        {BN.map((n) => (
          <button
            key={n.k}
            aria-label={n.label}
            className={tab === n.k ? "on" : ""}
            onClick={() => {
              setTab(n.k);
              window.scrollTo(0, 0);
            }}
          >
            <Icon name={n.icon} />
          </button>
        ))}
      </nav>
      {msg && <div className="ts">{msg}</div>}
    </>
  );
}