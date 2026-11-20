"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Icon from "../Icon";
import Logo from "../Logo";
import type { IconName } from "../icons";
import { T } from "../../lib/seed";
import { getSb } from "../../lib/sb";

const BN: { k: string; icon: IconName; label: string }[] = [
  { k: "home", icon: "home", label: "Inicio" },
  { k: "comms", icon: "users", label: "Comunidades" },
  { k: "live", icon: "live", label: "En vivo" },
  { k: "market", icon: "store", label: "Mercado" },
  { k: "profile", icon: "user", label: "Perfil" },
];

type Prof = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};
type Mini = { id: string; name: string; avatar_url: string | null };
type PostRow = {
  id: number;
  user_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author: Prof | null;
};
type Cmt = {
  id: number;
  body: string;
  created_at: string;
  author: { name: string } | null;
};
type StoryRow = {
  id: number;
  user_id: string;
  image_url: string;
  created_at: string;
  author: Mini | null;
};

function ago(s: string) {
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return "ahora";
  if (d < 3600) return `hace ${Math.floor(d / 60)} min`;
  if (d < 86400) return `hace ${Math.floor(d / 3600)} h`;
  return `hace ${Math.floor(d / 86400)} d`;
}

function shrink(file: File, max: number): Promise<Blob> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / im.width);
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d")?.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("img"))), "image/jpeg", 0.8);
    };
    im.onerror = () => rej(new Error("img"));
    im.src = url;
  });
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return src ? (
    <img className="av" src={src} alt="" />
  ) : (
    <div className="av">{(name || "U").charAt(0).toUpperCase()}</div>
  );
}

export default function HomeView() {
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Prof | null>(null);
  const [total, setTotal] = useState(0);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [likes, setLikes] = useState<Record<number, { n: number; mine: boolean }>>({});
  const [cmts, setCmts] = useState<Record<number, Cmt[]>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [viewer, setViewer] = useState<{ list: StoryRow[]; i: number } | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [tab, setTab] = useState("home");
  const [viewUid, setViewUid] = useState<string | null>(null);
  const [prof, setProf] = useState<Prof | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [list, setList] = useState<{ title: string; users: Mini[] } | null>(null);
  const [sheet, setSheet] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [dbg, setDbg] = useState("");

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bnRef = useRef<HTMLInputElement>(null);
  const avRef = useRef<HTMLInputElement>(null);
  const stRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef<string | null>(null);
  const fresh = useRef<Record<string, () => void>>({});
  uidRef.current = user?.id ?? null;

  const sb = () => getSb();
  const target = tab === "profile" ? (viewUid ?? user?.id ?? null) : null;

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 3200);
  }

  async function loadTotal() {
    const { count } = await sb()
      .from("sl_profiles")
      .select("id", { count: "exact", head: true });
    setTotal(count ?? 0);
  }

  async function profMap(ids: string[]) {
    const u = Array.from(new Set(ids));
    const m: Record<string, Prof> = {};
    if (!u.length) return m;
    const { data } = await sb()
      .from("sl_profiles")
      .select("id,name,bio,avatar_url,banner_url")
      .in("id", u);
    for (const p of (data ?? []) as Prof[]) m[p.id] = p;
    return m;
  }

  async function loadPosts() {
    const { data, error } = await sb()
      .from("sl_posts")
      .select("id,user_id,body,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setDbg("Error: " + error.message);
      return flash("Error al cargar publicaciones: " + error.message);
    }
    setDbg("Recibidas del servidor: " + (data ?? []).length);
    const raw = (data ?? []) as Omit<PostRow, "author">[];
    const pm = await profMap(raw.map((r) => r.user_id));
    const rows: PostRow[] = raw.map((r) => ({ ...r, author: pm[r.user_id] ?? null }));
    setPosts(rows);
    if (!rows.length) {
      setLikes({});
      return;
    }
    const { data: lk } = await sb()
      .from("sl_likes")
      .select("post_id,user_id")
      .in(
        "post_id",
        rows.map((r) => r.id)
      );
    const m: Record<number, { n: number; mine: boolean }> = {};
    for (const r of (lk ?? []) as { post_id: number; user_id: string }[]) {
      const x = m[r.post_id] ?? { n: 0, mine: false };
      x.n++;
      if (r.user_id === uidRef.current) x.mine = true;
      m[r.post_id] = x;
    }
    setLikes(m);
  }

  async function loadStories() {
    const since = new Date(Date.now() - 864e5).toISOString();
    const { data, error } = await sb()
      .from("sl_stories")
      .select("id,user_id,image_url,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) return flash("Error al cargar historias: " + error.message);
    const raw = (data ?? []) as Omit<StoryRow, "author">[];
    const pm = await profMap(raw.map((r) => r.user_id));
    setStories(
      raw.map((r) => ({
        ...r,
        author: pm[r.user_id]
          ? { id: r.user_id, name: pm[r.user_id].name, avatar_url: pm[r.user_id].avatar_url }
          : null,
      }))
    );
  }

  async function loadFollowing() {
    const uid = uidRef.current;
    if (!uid) return setFollowing([]);
    const { data } = await sb()
      .from("sl_follows")
      .select("followed_id")
      .eq("follower_id", uid);
    setFollowing(((data ?? []) as { followed_id: string }[]).map((r) => r.followed_id));
  }

  async function loadComments(id: number) {
    const { data } = await sb()
      .from("sl_comments")
      .select("id,user_id,body,created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    const raw = (data ?? []) as { id: number; user_id: string; body: string; created_at: string }[];
    const pm = await profMap(raw.map((r) => r.user_id));
    setCmts((c) => ({
      ...c,
      [id]: raw.map((r) => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        author: pm[r.user_id] ? { name: pm[r.user_id].name } : null,
      })),
    }));
  }

  async function loadProfile(uid: string) {
    const [p, a, b] = await Promise.all([
      sb()
        .from("sl_profiles")
        .select("id,name,bio,avatar_url,banner_url")
        .eq("id", uid)
        .maybeSingle(),
      sb().from("sl_follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", uid),
      sb().from("sl_follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", uid),
    ]);
    setProf((p.data as Prof | null) ?? null);
    setCounts({ followers: a.count ?? 0, following: b.count ?? 0 });
  }

  fresh.current = {
    total: loadTotal,
    posts: loadPosts,
    stories: loadStories,
    following: loadFollowing,
    comments: () => {
      if (open !== null) loadComments(open);
    },
    profile: () => {
      if (target) loadProfile(target);
    },
  };

  useEffect(() => {
    const c = getSb();
    c.auth.getUser().then(({ data }) => setUser(data.user));
    fresh.current.total();
    fresh.current.posts();
    fresh.current.stories();
    const ch = c.channel("selah-live");
    const on = (t: string, fn: () => void) =>
      ch.on("postgres_changes", { event: "*", schema: "public", table: t }, fn);
    on("sl_profiles", () => {
      fresh.current.total();
      fresh.current.profile();
    });
    on("sl_posts", () => fresh.current.posts());
    on("sl_likes", () => fresh.current.posts());
    on("sl_stories", () => fresh.current.stories());
    on("sl_follows", () => {
      fresh.current.following();
      fresh.current.profile();
    });
    on("sl_comments", () => fresh.current.comments());
    ch.subscribe();
    return () => {
      c.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    getSb()
      .from("sl_profiles")
      .select("id,name,bio,avatar_url,banner_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setMe((data as Prof | null) ?? null));
    fresh.current.following();
    fresh.current.posts();
  }, [user]);

  useEffect(() => {
    if (target) loadProfile(target);
    else setProf(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  async function uploadImg(f: File, max: number, folder: string) {
    const b = await shrink(f, max);
    const path = `${uidRef.current}/${folder}-${Date.now()}.jpg`;
    const { error } = await sb()
      .storage.from("selah-media")
      .upload(path, b, { contentType: "image/jpeg" });
    if (error) throw error;
    return sb().storage.from("selah-media").getPublicUrl(path).data.publicUrl;
  }

  function compose() {
    if (!user) return flash("Inicia sesión para publicar.");
    setTab("home");
    setSheet(true);
    setTimeout(() => taRef.current?.focus(), 80);
  }

  async function publish() {
    if (!user) return flash("Inicia sesión para publicar.");
    const t = text.trim();
    if (!t && !file) return flash("Escribe algo o adjunta una imagen.");
    setBusy(true);
    try {
      const image_url = file ? await uploadImg(file, 900, "post") : null;
      const { error } = await sb()
        .from("sl_posts")
        .insert({ user_id: user.id, body: t, image_url });
      if (error) {
        flash("Error al publicar: " + error.message);
        return;
      }
      setText("");
      setFile(null);
      setPreview(null);
      setSheet(false);
      await loadPosts();
      window.scrollTo(0, 0);
    } catch {
      flash("No se pudo publicar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function addStory(f: File) {
    if (!user) return flash("Inicia sesión para subir una historia.");
    try {
      flash("Subiendo historia...");
      const image_url = await uploadImg(f, 900, "story");
      const { error } = await sb().from("sl_stories").insert({ user_id: user.id, image_url });
      if (error) throw error;
      await loadStories();
      flash("Historia publicada por 24 horas.");
    } catch {
      flash("No se pudo subir la historia.");
    }
  }

  async function setImage(kind: "avatar_url" | "banner_url", f: File) {
    if (!user) return flash("Inicia sesión primero.");
    try {
      flash("Subiendo...");
      const url = await uploadImg(f, kind === "avatar_url" ? 400 : 900, kind === "avatar_url" ? "avatar" : "banner");
      const { error } = await sb()
        .from("sl_profiles")
        .update({ [kind]: url })
        .eq("id", user.id);
      if (error) throw error;
      setMe((m) => (m ? { ...m, [kind]: url } : m));
      setProf((p) => (p && p.id === user.id ? { ...p, [kind]: url } : p));
      loadPosts();
      flash("Listo.");
    } catch {
      flash("No se pudo subir la imagen.");
    }
  }

  async function saveBio(v: string) {
    if (!user || v === (me?.bio ?? "")) return;
    const { error } = await sb().from("sl_profiles").update({ bio: v }).eq("id", user.id);
    if (!error) setMe((m) => (m ? { ...m, bio: v } : m));
  }

  async function toggleLike(id: number) {
    if (!user) return flash("Inicia sesión para dar me gusta.");
    const cur = likes[id] ?? { n: 0, mine: false };
    setLikes((l) => ({ ...l, [id]: { n: cur.n + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    if (cur.mine) {
      await sb().from("sl_likes").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await sb().from("sl_likes").insert({ post_id: id, user_id: user.id });
    }
  }

  async function toggleFollow(uid: string) {
    if (!user) return flash("Inicia sesión para seguir.");
    if (uid === user.id) return;
    const on = following.includes(uid);
    setFollowing((f) => (on ? f.filter((x) => x !== uid) : [...f, uid]));
    if (on) {
      await sb().from("sl_follows").delete().eq("follower_id", user.id).eq("followed_id", uid);
    } else {
      await sb().from("sl_follows").insert({ follower_id: user.id, followed_id: uid });
    }
    if (target) loadProfile(target);
  }

  function toggleComments(id: number) {
    if (open === id) return setOpen(null);
    setOpen(id);
    loadComments(id);
  }

  async function addComment(id: number) {
    if (!user) return flash("Inicia sesión para comentar.");
    const t = (drafts[id] ?? "").trim();
    if (!t) return;
    setDrafts((d) => ({ ...d, [id]: "" }));
    await sb().from("sl_comments").insert({ post_id: id, user_id: user.id, body: t });
    loadComments(id);
  }

  async function logout() {
    await sb().auth.signOut();
    window.location.href = "/acceso";
  }

  function share() {
    try {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    } catch {}
    flash(T.compartida);
  }

  function openProfile(uid: string) {
    setViewUid(uid);
    setTab("profile");
    window.scrollTo(0, 0);
  }

  async function openList(kind: "followers" | "following") {
    if (!target) return;
    const col = kind === "followers" ? "followed_id" : "follower_id";
    const other = kind === "followers" ? "follower_id" : "followed_id";
    const { data } = await sb().from("sl_follows").select("follower_id,followed_id").eq(col, target);
    const ids = ((data ?? []) as Record<string, string>[]).map((r) => r[other]);
    let users: Mini[] = [];
    if (ids.length) {
      const { data: ps } = await sb().from("sl_profiles").select("id,name,avatar_url").in("id", ids);
      users = (ps ?? []) as Mini[];
    }
    setList({ title: kind === "followers" ? "Seguidores" : "Siguiendo", users });
  }

  const groups = (() => {
    const m = new Map<string, StoryRow[]>();
    for (const s of stories) {
      const a = m.get(s.user_id) ?? [];
      a.push(s);
      m.set(s.user_id, a);
    }
    const arr = Array.from(m.values());
    arr.sort(
      (a, b) =>
        (a[0].user_id === user?.id ? -1 : 0) - (b[0].user_id === user?.id ? -1 : 0)
    );
    return arr;
  })();

  function card(p: PostRow) {
    const name = p.author?.name ?? "Usuario";
    const lk = likes[p.id] ?? { n: 0, mine: false };
    const isMine = p.user_id === user?.id;
    return (
      <article className="pp" key={p.id}>
        <div className="ph">
          <button className="avb" onClick={() => openProfile(p.user_id)} aria-label="Ver perfil">
            <Avatar name={name} src={p.author?.avatar_url} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{name}</b>
            <small>{ago(p.created_at)}</small>
          </div>
          {!isMine && (
            <button className="b2 sg" onClick={() => toggleFollow(p.user_id)}>
              {following.includes(p.user_id) ? "Siguiendo" : "Seguir"}
            </button>
          )}
          <button className="mo" aria-label="Reportar" onClick={() => flash(T.reporte)}>
            <Icon name="dots" />
          </button>
        </div>
        {p.image_url ? (
          <>
            <div className="pm">
              <img src={p.image_url} alt="" />
            </div>
            {p.body && <p className="cp">{p.body}</p>}
          </>
        ) : (
          <div className="pz">
            <p>{p.body}</p>
            <small>Selah</small>
          </div>
        )}
        <div className="ac">
          <button className={lk.mine ? "lkd" : ""} onClick={() => toggleLike(p.id)}>
            <Icon name="heart" /> {lk.n}
          </button>
          <button onClick={() => toggleComments(p.id)}>
            <Icon name="chat" /> {cmts[p.id]?.length ?? ""}
          </button>
          <button className="shr" onClick={share} aria-label="Compartir">
            <Icon name="share" />
          </button>
        </div>
        <div id={`c${p.id}`}>
          {open === p.id && (
            <>
              {(cmts[p.id] ?? []).map((c2) => (
                <p className="cm" key={c2.id}>
                  <b>{c2.author?.name ?? "Usuario"}</b> {c2.body}
                </p>
              ))}
              <div className="row" style={{ marginTop: 8 }}>
                <input
                  placeholder="Escribe un comentario respetuoso"
                  value={drafts[p.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
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

  const own = !!prof && prof.id === user?.id;
  const profPosts = posts.filter((p) => p.user_id === prof?.id);

  const profileView = !user ? (
    <div className="cd">
      <h2>Perfil</h2>
      <p className="mu">Inicia sesión para ver tu perfil.</p>
      <a className="b" href="/acceso">
        Iniciar sesión
      </a>
    </div>
  ) : !prof ? (
    <div className="cd">
      <p className="mu">Cargando perfil...</p>
    </div>
  ) : (
    <div>
      <div
        className="pbn"
        style={prof.banner_url ? { backgroundImage: `url(${prof.banner_url})` } : undefined}
      >
        {own && (
          <button className="b2" onClick={() => bnRef.current?.click()}>
            <Icon name="img" /> Cambiar portada
          </button>
        )}
      </div>
      <div className="pin">
        <button
          className="pav"
          aria-label="Foto de perfil"
          onClick={() => own && avRef.current?.click()}
        >
          {prof.avatar_url ? (
            <img src={prof.avatar_url} alt="" />
          ) : (
            <span>{prof.name.charAt(0).toUpperCase()}</span>
          )}
        </button>
        <h2>{prof.name}</h2>
        {own ? (
          <textarea
            key={prof.id}
            rows={2}
            aria-label="Biografía"
            defaultValue={prof.bio ?? ""}
            onBlur={(e) => saveBio(e.target.value)}
          />
        ) : (
          <p className="mu">{prof.bio}</p>
        )}
        <div className="pst">
          <div>
            <b>{profPosts.length}</b>
            <span>Publicaciones</span>
          </div>
          <button className="pfs" onClick={() => openList("followers")}>
            <b>{counts.followers}</b>
            <span>Seguidores</span>
          </button>
          <button className="pfs" onClick={() => openList("following")}>
            <b>{counts.following}</b>
            <span>Siguiendo</span>
          </button>
        </div>
        {own && (
          <div className="pfa">
            <button className="b2" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
        {!own && (
          <div className="pfa">
            <button className="b" onClick={() => toggleFollow(prof.id)}>
              {following.includes(prof.id) ? "Siguiendo" : "Seguir"}
            </button>
          </div>
        )}
      </div>
      <h3 className="pt">Publicaciones</h3>
      {profPosts.length ? (
        profPosts.map(card)
      ) : (
        <p className="mu" style={{ padding: "0 14px" }}>
          Aún no hay publicaciones.
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="ap">
        <header className="tb">
          <button aria-label="Notificaciones" onClick={() => flash("No tienes notificaciones nuevas.")}>
            <Icon name="bell" />
            <i className="dot" />
          </button>
          <div className="lg">
            <Logo size={30} />
            Selah
          </div>
          <div className="ct" title="Usuarios registrados">
            <Icon name="users" /> {total.toLocaleString("es")}
          </div>
        </header>

        {tab === "home" && (
          <div className="st">
            <button onClick={() => (user ? stRef.current?.click() : flash("Inicia sesión para subir una historia."))}>
              <div className="rg me">
                <div>
                  {me?.avatar_url ? (
                    <img src={me.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Icon name="plus" />
                  )}
                </div>
              </div>
              <span>Tu historia</span>
            </button>
            {groups.map((g) => {
              const a = g[0].author;
              const mineG = g[0].user_id === user?.id;
              return (
                <button key={g[0].user_id} onClick={() => setViewer({ list: g, i: 0 })}>
                  <div className="rg">
                    <div>
                      <img
                        src={g[g.length - 1].image_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                  <span>{mineG ? "Mi historia" : a?.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <main>
          {tab === "profile" ? (
            profileView
          ) : tab === "home" ? (
            posts.length ? (
              posts.map(card)
            ) : (
              <div className="cd">
                <h2>Sé el primero en publicar</h2>
                <p className="mu">Toca el botón + para compartir algo con la comunidad.</p>
                {dbg && <p className="mu"><small>{dbg}</small></p>}
              </div>
            )
          ) : (
            <div className="cd">
              <h2>{BN.find((n) => n.k === tab)?.label}</h2>
              <p className="mu">{T.pronto}</p>
            </div>
          )}
        </main>

        <div className={"cd cs" + (sheet ? " on" : "")}>
          <div className="sh">
            <h3>Nueva publicación</h3>
            <button className="b2" onClick={() => setSheet(false)}>
              Cerrar
            </button>
          </div>
          <textarea
            ref={taRef}
            rows={4}
            placeholder={T.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {preview && (
            <div className="mw">
              <img src={preview} alt="" />
            </div>
          )}
          <div className="row">
            <button className="b2" onClick={() => fileRef.current?.click()}>
              <Icon name="img" /> Imagen
            </button>
            <button className="b" style={{ marginLeft: "auto" }} disabled={busy} onClick={publish}>
              {busy ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
          }
          e.target.value = "";
        }}
      />
      <input
        ref={bnRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImage("banner_url", f);
          e.target.value = "";
        }}
      />
      <input
        ref={avRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImage("avatar_url", f);
          e.target.value = "";
        }}
      />
      <input
        ref={stRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addStory(f);
          e.target.value = "";
        }}
      />

      {(sheet || list) && (
        <div
          className="bk"
          onClick={() => {
            setSheet(false);
            setList(null);
          }}
        />
      )}

      {list && (
        <div className="fl">
          <div className="sh">
            <h3>{list.title}</h3>
            <button className="b2" onClick={() => setList(null)}>
              Cerrar
            </button>
          </div>
          {list.users.length ? (
            list.users.map((u) => (
              <button
                className="it"
                key={u.id}
                onClick={() => {
                  setList(null);
                  openProfile(u.id);
                }}
              >
                <Avatar name={u.name} src={u.avatar_url} />
                <b>{u.name}</b>
              </button>
            ))
          ) : (
            <p className="mu">Todavía no hay nadie aquí.</p>
          )}
        </div>
      )}

      {viewer &&
        (() => {
          const s = viewer.list[viewer.i];
          return (
            <div className="sv">
              <div className="svh">
                <b>{s.author?.name}</b>
                <span>{ago(s.created_at)}</span>
                <button onClick={() => setViewer(null)}>Cerrar</button>
              </div>
              <img src={s.image_url} alt="" />
              <button
                className="svl"
                aria-label="Anterior"
                onClick={() => setViewer((v) => (v && v.i > 0 ? { ...v, i: v.i - 1 } : v))}
              />
              <button
                className="svr"
                aria-label="Siguiente"
                onClick={() =>
                  setViewer((v) => (v ? (v.i < v.list.length - 1 ? { ...v, i: v.i + 1 } : null) : v))
                }
              />
            </div>
          );
        })()}

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
              setViewUid(null);
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