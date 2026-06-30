

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1B19]">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-serif text-xl tracking-tight">AsisPro</span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/login"
            className="text-[#57534E] transition-colors hover:text-[#1C1B19]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#1C1B19] px-4 py-2 text-[#FAF9F6] transition-colors hover:bg-[#D97706]"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 sm:px-10 sm:pt-20">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Copy */}
          <div>
            <p className="mb-6 text-sm tracking-wide text-[#A16207]">
              Control de asistencia · Gestión de RRHH
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              La hora de entrada
              <br />
              ya no se discute.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#57534E]">
              Marcaciones, turnos y vacaciones de tu equipo, registrados al
              segundo y ordenados solos. Sin planillas, sin relojes
              biométricos que nadie revisa.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[#D97706] px-7 py-3.5 font-medium text-white transition-transform hover:scale-[1.02] hover:bg-[#B45309]"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className="px-3 py-3.5 text-[#1C1B19] underline decoration-[#D97706] decoration-2 underline-offset-4 transition-colors hover:text-[#D97706]"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <p className="mt-8 text-sm text-[#A8A29E]">
              Pensado para equipos chilenos. RUT, turnos y horas extra,
              calculados como corresponde.
            </p>
          </div>

          {/* Signature element: tarjeta de marcación en vivo */}
          <div className="relative">
            <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[#F0EFEC] pb-6">
                <div>
                  <p className="text-sm text-[#A8A29E]">Hoy</p>
                  <p className="font-serif text-2xl">Camila Rojas</p>
                </div>
                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#047857]">
                  En turno
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A8A29E]">
                    Entrada
                  </p>
                  <p className="mt-1 font-serif text-3xl">08:59</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#A8A29E]">
                    Salida estimada
                  </p>
                  <p className="mt-1 font-serif text-3xl text-[#A8A29E]">
                    18:00
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#F0EFEC] pt-6">
                {[
                  ["Lucas Fuentes", "09:02", "Atraso leve"],
                  ["Pedro Soto", "08:47", "A tiempo"],
                ].map(([name, time, tag]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#44403C]">{name}</span>
                    <span className="text-[#A8A29E]">{time}</span>
                    <span className="text-xs text-[#A8A29E]">{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* acento decorativo sutil */}
            <div className="absolute -right-3 -top-3 -z-10 h-full w-full rounded-3xl bg-[#D97706]/10" />
          </div>
        </div>
      </main>

      {/* Tira de flujo real (no decorativa) */}
      <section className="border-y border-[#E7E5E4] bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3 sm:px-10">
          <div>
            <p className="font-serif text-lg">Marca</p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Cada empleado registra entrada y salida desde su cuenta, en
              segundos.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg">Revisa</p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Tú ves atrasos, horas extra y ausencias por departamento, en
              tiempo real.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg">Exporta</p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Cierra el mes y descarga los datos listos para tu sistema de
              remuneraciones.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#A8A29E] sm:px-10">
        © {new Date().getFullYear()} AsisPro
      </footer>
    </div>
  );
}