"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";
import Logo from "../Logo";
import { createClient } from "../../lib/supabase/client";

const T = {
  lema: "Haz una pausa. Conecta con Dios y con tu comunidad.",
  f1: "Comunidad moderada con normas claras",
  f2: "Contenido exclusivo y pagos protegidos",
  f3: "Transmisiones en vivo para tu iglesia",
  ingresar: "Ingresar",
  crear: "Crear cuenta",
  nombre: "Nombre completo",
  correo: "Correo electr\u00f3nico",
  clave: "Contrase\u00f1a",
  normas: "Acepto las normas y lineamientos de la comunidad",
  vacio: "Escribe tu correo y tu contrase\u00f1a.",
  datos:
    "Completa tu nombre, un correo v\u00e1lido y una contrase\u00f1a de 6 o m\u00e1s caracteres.",
  normasErr: "Debes aceptar las normas de la comunidad.",
  incorrecto: "Correo o contrase\u00f1a incorrectos.",
  sinConfirmar: "Debes confirmar tu correo antes de ingresar.",
  suspendida: "Cuenta suspendida hasta el ",
  existe: "Ese correo ya est\u00e1 registrado.",
  bloqueado:
    "No fue posible crear la cuenta. Si tu correo o dispositivo fue bloqueado, no puedes registrarte.",
  confirmar:
    "Te enviamos un correo para confirmar tu cuenta. Rev\u00edsalo y luego ingresa.",
  error: "Ocurri\u00f3 un error. Intenta de nuevo.",
  espera: "Un momento...",
};

function getDeviceId(): string | null {
  try {
    let d = localStorage.getItem("sid");
    if (!d) {
      d = crypto.randomUUID();
      localStorage.setItem("sid", d);
    }
    return d;
  } catch {
    return null;
  }
}

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"l" | "r">("l");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const reg = mode === "r";

  function switchMode(m: "l" | "r") {
    setMode(m);
    setErr("");
    setInfo("");
  }

  async function submit() {
    setErr("");
    setInfo("");
    const mail = email.trim().toLowerCase();
    if (reg) {
      if (!name.trim() || !/^\S+@\S+\.\S+$/.test(mail) || pass.length < 6) {
        setErr(T.datos);
        return;
      }
      if (!ok) {
        setErr(T.normasErr);
        return;
      }
    } else if (!mail || !pass) {
      setErr(T.vacio);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();

      if (reg) {
        const device = getDeviceId();
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password: pass,
          options: {
            data: {
              full_name: name.trim(),
              accepted_rules: true,
              ...(device ? { device_id: device } : {}),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          if (/already|registered/i.test(error.message)) setErr(T.existe);
          else if (/database error/i.test(error.message)) setErr(T.bloqueado);
          else setErr(T.error);
          return;
        }
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setErr(T.existe);
          return;
        }
        if (data.session) {
          router.replace("/inicio");
          router.refresh();
          return;
        }
        setInfo(T.confirmar);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass,
      });
      if (error || !data.user) {
        setErr(error && /confirm/i.test(error.message) ? T.sinConfirmar : T.incorrecto);
        return;
      }
      const { data: st } = await supabase
        .from("account_status")
        .select("suspended_until")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (st?.suspended_until && new Date(st.suspended_until) > new Date()) {
        await supabase.auth.signOut();
        setErr(T.suspendida + new Date(st.suspended_until).toLocaleDateString("es") + ".");
        return;
      }
      router.replace("/inicio");
      router.refresh();
    } catch {
      setErr(T.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="au">
      <section>
        <Logo size={64} />
        <h1 style={{ marginTop: 14 }}>Selah</h1>
        <p style={{ fontSize: 18 }}>{T.lema}</p>
        <ul>
          <li>
            <Icon name="shield" />
            {T.f1}
          </li>
          <li>
            <Icon name="lock" />
            {T.f2}
          </li>
          <li>
            <Icon name="live" />
            {T.f3}
          </li>
        </ul>
      </section>

      <section className="cd">
        <div className="tabs">
          <button type="button" className={reg ? "" : "on"} onClick={() => switchMode("l")}>
            {T.ingresar}
          </button>
          <button type="button" className={reg ? "on" : ""} onClick={() => switchMode("r")}>
            {T.crear}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {reg && (
            <input
              placeholder={T.nombre}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder={T.correo}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder={T.clave}
            autoComplete={reg ? "new-password" : "current-password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {reg && (
            <label className="ck">
              <input
                type="checkbox"
                checked={ok}
                onChange={(e) => setOk(e.target.checked)}
              />{" "}
              {T.normas}
            </label>
          )}
          <p className="er">{err}</p>
          {info && <p className="mu">{info}</p>}
          <button type="submit" className="b" style={{ width: "100%" }} disabled={busy}>
            {busy ? T.espera : reg ? T.crear : T.ingresar}
          </button>
        </form>
      </section>
    </div>
  );
}