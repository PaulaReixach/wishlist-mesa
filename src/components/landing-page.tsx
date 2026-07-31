"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Compass,
  Heart,
  Home,
  Map,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
  Utensils,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MesaLogo, MesaMark } from "@/components/brand";
import { WaitlistForm } from "@/components/waitlist-form";
import styles from "./landing-page.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

const avatars = [
  { src: "/images/avatar-paula.webp", alt: "Paula" },
  { src: "/images/avatar-lucas.webp", alt: "Lucas" },
  { src: "/images/avatar-ana.webp", alt: "Ana" },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function AvatarStack({
  small = false,
  twoOnly = false,
}: {
  small?: boolean;
  twoOnly?: boolean;
}) {
  const visibleAvatars = twoOnly ? avatars.slice(0, 2) : avatars;

  return (
    <span className={`${styles.avatarStack} ${small ? styles.avatarSmall : ""}`}>
      {visibleAvatars.map((avatar) => (
        <span className={styles.avatarFace} key={avatar.src}>
          <Image src={avatar.src} alt={avatar.alt} width={40} height={40} />
        </span>
      ))}
      {!twoOnly && <span className={styles.avatarMore}>+2</span>}
    </span>
  );
}

function PhonePreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.phoneStage} aria-label="Vista previa de la app MESA">
      <motion.div
        className={`${styles.floatingChip} ${styles.chipTop}`}
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className={styles.chipIcon}>
          <Heart size={15} fill="currentColor" />
        </span>
        Guardado en Parejita
      </motion.div>

      <motion.div
        className={`${styles.floatingChip} ${styles.chipBottom}`}
        animate={reduceMotion ? undefined : { y: [0, 9, 0] }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      >
        <AvatarStack small />
        <span>
          <strong>Plan de viernes</strong>
          <small>5 personas</small>
        </span>
      </motion.div>

      <motion.div
        className={styles.phone}
        initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: 2 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, delay: 0.35, ease }}
      >
        <div className={styles.phoneTop}>
          <span>9:41</span>
          <span className={styles.dynamicIsland} />
          <span className={styles.phoneSignals}>
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className={styles.appHeader}>
          <div>
            <span className={styles.appEyebrow}>Hola, Paula</span>
            <h3>¿Qué te apetece hoy?</h3>
          </div>
          <span className={styles.appAvatar}>
            <Image
              src="/images/avatar-paula.webp"
              alt="Foto de perfil de Paula"
              width={36}
              height={36}
            />
          </span>
        </div>
        <div className={styles.appSearch}>
          <Search size={15} />
          <span>Restaurantes, cocinas…</span>
          <span className={styles.filterButton}>
            <Map size={14} />
          </span>
        </div>
        <div className={styles.appSectionTitle}>
          <strong>Mis grupos</strong>
          <span>
            Ver todos <ChevronRight size={12} />
          </span>
        </div>
        <div className={styles.appGroups}>
          <div className={styles.appGroup}>
            <div className={styles.groupThumb}>
              <Image
                src="/images/mesa-mediterranean-table.webp"
                alt="Mesa de cocina mediterránea"
                width={80}
                height={80}
              />
            </div>
            <div>
              <strong>Plan de viernes</strong>
              <small>8 restaurantes</small>
            </div>
            <AvatarStack small />
          </div>
          <div className={styles.appGroup}>
            <div className={styles.groupThumb}>
              <Image
                src="/images/mesa-japanese-table.webp"
                alt="Mesa de cocina japonesa"
                width={80}
                height={80}
              />
            </div>
            <div>
              <strong>Parejita</strong>
              <small>12 restaurantes</small>
            </div>
            <AvatarStack small twoOnly />
          </div>
        </div>
        <div className={styles.appSectionTitle}>
          <strong>Puede que te guste</strong>
          <span>
            Explorar <ChevronRight size={12} />
          </span>
        </div>
        <div className={styles.restaurantCard}>
          <div className={styles.restaurantImage}>
            <Image
              src="/images/mesa-mediterranean-table.webp"
              alt="Platos de Casa Nómada"
              fill
              sizes="280px"
            />
            <span className={styles.heartButton}>
              <Heart size={15} fill="currentColor" />
            </span>
            <span className={styles.ratingBadge}>
              <Star size={11} fill="currentColor" /> 4,7
            </span>
          </div>
          <div className={styles.restaurantInfo}>
            <div>
              <strong>Casa Nómada</strong>
              <small>Mediterránea · €€</small>
            </div>
            <span>
              <MapPin size={11} /> 1,2 km
            </span>
          </div>
        </div>
        <nav className={styles.appNav} aria-label="Navegación de ejemplo">
          <span className={styles.navActive}>
            <Home size={18} />
            Inicio
          </span>
          <span>
            <Compass size={18} />
            Explorar
          </span>
          <span className={styles.navAdd}>
            <Plus size={22} />
          </span>
          <span>
            <UsersRound size={18} />
            Grupos
          </span>
          <span>
            <UserRound size={18} />
            Perfil
          </span>
        </nav>
      </motion.div>
    </div>
  );
}

const steps = [
  {
    number: "01",
    icon: UsersRound,
    title: "Crea vuestro grupo",
    text: "Pareja, amigos, familia o compañeros. Cada plan tiene su propio espacio.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Descubrid y guardad",
    text: "Añadid restaurantes, explorad el mapa y reunid todas las opciones sin perder enlaces.",
  },
  {
    number: "03",
    icon: Check,
    title: "Decidid sin vueltas",
    text: "Comparad favoritos y convertid el eterno «me da igual» en el próximo plan.",
  },
];

function ChatCard() {
  return (
    <div className={styles.chatCard}>
      <div className={styles.chatHeader}>
        <AvatarStack small />
        <div>
          <strong>Plan de viernes</strong>
          <span>5 participantes</span>
        </div>
        <span className={styles.chatDots} aria-label="Más opciones">
          <MoreHorizontal size={19} />
        </span>
      </div>
      <div className={styles.messages}>
        <div className={`${styles.message} ${styles.messageOther}`}>
          ¿Dónde cenamos mañana?
          <small>19:42</small>
        </div>
        <div className={`${styles.message} ${styles.messageMe}`}>
          A mí me da igual
          <small>19:43</small>
        </div>
        <div className={`${styles.message} ${styles.messageOther}`}>
          ¿El italiano que mandasteis?
          <small>19:44</small>
        </div>
        <div className={`${styles.message} ${styles.messageMe}`}>
          ¿Cuál era? No lo encuentro
          <small>19:45</small>
        </div>
      </div>
      <div className={styles.mesaAnswer}>
        <MesaMark className={styles.answerMark} />
        <div>
          <span>MESA</span>
          <strong>Tenéis 6 opciones guardadas</strong>
          <small>Todo el grupo, en un solo sitio.</small>
        </div>
        <ArrowRight size={18} />
      </div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className={styles.featureGrid}>
      <Reveal className={`${styles.featureCard} ${styles.mapFeature}`}>
        <div className={styles.featureCopy}>
          <span className={styles.miniEyebrow}>
            <MapPin size={14} /> Descubre
          </span>
          <h3>Una ciudad llena de próximos favoritos.</h3>
          <p>
            Explora restaurantes cerca de ti y encuentra ese sitio que todavía
            no sabíais que estabais buscando.
          </p>
        </div>
        <div className={styles.mapCanvas}>
          <iframe
            title="Mapa de restaurantes en Girona"
            src="https://www.google.com/maps?q=restaurantes%20en%20Girona%2C%20Espa%C3%B1a&z=14&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            tabIndex={-1}
          />
          <div className={styles.mapResult}>
            <div className={styles.mapResultArt}>
              <Image
                src="/images/mesa-mediterranean-table.webp"
                alt="Platos de La Terrassa"
                width={100}
                height={100}
              />
            </div>
            <span>
              <strong>La Terrassa</strong>
              <small>4,8 · Mediterránea</small>
            </span>
            <Heart size={16} />
          </div>
        </div>
      </Reveal>

      <Reveal
        className={`${styles.featureCard} ${styles.groupsFeature}`}
        delay={0.05}
      >
        <span className={styles.miniEyebrow}>
          <UsersRound size={14} /> Tus personas
        </span>
        <h3>Un grupo para cada historia.</h3>
        <p>
          Lo que guardas con tu pareja no se mezcla con la cena de cumpleaños.
        </p>
        <div className={styles.groupList}>
          <div>
            <span className={styles.groupListImage}>
              <Image
                src="/images/mesa-mediterranean-table.webp"
                alt="Plan de viernes"
                width={90}
                height={90}
              />
            </span>
            <span>
              <strong>Plan de viernes</strong>
              <small>8 sitios por probar</small>
            </span>
            <AvatarStack small />
          </div>
          <div>
            <span className={styles.groupListImage}>
              <Image
                src="/images/mesa-japanese-table.webp"
                alt="Plan en pareja"
                width={90}
                height={90}
              />
            </span>
            <span>
              <strong>Parejita</strong>
              <small>12 sitios por probar</small>
            </span>
            <AvatarStack small twoOnly />
          </div>
        </div>
      </Reveal>

      <Reveal
        className={`${styles.featureCard} ${styles.savedFeature}`}
        delay={0.08}
      >
        <div className={styles.savedTop}>
          <span className={styles.miniEyebrow}>
            <Heart size={14} /> Sin perder nada
          </span>
          <span className={styles.savedCount}>12 guardados</span>
        </div>
        <h3>Ese restaurante ya no se pierde en el chat.</h3>
        <div className={styles.savedCards}>
          <div className={styles.savedBack}>
            <span>Can Mar</span>
          </div>
          <div className={styles.savedMiddle}>
            <span>Casa Nómada</span>
          </div>
          <div className={styles.savedFront}>
            <div className={styles.savedArt}>
              <Image
                src="/images/mesa-japanese-table.webp"
                alt="Platos de La Terrassa"
                width={148}
                height={148}
              />
            </div>
            <span>
              <strong>La Terrassa</strong>
              <small>Guardado en Parejita</small>
            </span>
            <Heart size={17} fill="currentColor" />
          </div>
        </div>
      </Reveal>

      <Reveal
        className={`${styles.featureCard} ${styles.decisionFeature}`}
        delay={0.12}
      >
        <span className={styles.miniEyebrow}>
          <Sparkles size={14} /> Plan resuelto
        </span>
        <h3>Menos “ya veremos”. Más reservas.</h3>
        <p>Las opciones favoritas del grupo, claras y listas para decidir.</p>
        <div className={styles.decisionList}>
          <div>
            <span className={styles.rank}>1</span>
            <span>
              <strong>Casa Nómada</strong>
              <small>Mediterránea · €€</small>
            </span>
            <span className={styles.match}>
              <Heart size={13} fill="currentColor" /> 4
            </span>
          </div>
          <div>
            <span className={styles.rank}>2</span>
            <span>
              <strong>Umami Club</strong>
              <small>Japonesa · €€</small>
            </span>
            <span className={styles.match}>
              <Heart size={13} fill="currentColor" /> 3
            </span>
          </div>
          <button type="button">
            Ver opciones <ArrowRight size={15} />
          </button>
        </div>
      </Reveal>
    </div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="#inicio" aria-label="MESA, volver al inicio">
          <MesaLogo />
        </a>
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#dentro-de-mesa">Dentro de MESA</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <a className={styles.headerCta} href="#lista">
          Acceso anticipado <ArrowRight size={16} />
        </a>
      </header>

      <main>
        <section className={styles.hero} id="inicio">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroGrid}>
            <motion.div
              className={styles.heroCopy}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease }}
            >
              <span className={styles.betaBadge}>
                <span />
                Beta privada · Muy pronto en Android
              </span>
              <h1>
                Los mejores planes empiezan alrededor de una{" "}
                <em>mesa.</em>
              </h1>
              <p>
                Crea grupos, descubre restaurantes, guarda los que os encantan
                y decidid juntos dónde será el próximo plan.
              </p>
              <div className={styles.heroForm}>
                <WaitlistForm />
              </div>
              <div className={styles.heroTrust}>
                <AvatarStack />
                <span>
                  <strong>Sé de las primeras personas en probar MESA</strong>
                  <small>Acceso anticipado y novedades de la beta.</small>
                </span>
              </div>
            </motion.div>
            <PhonePreview />
          </div>
          <a className={styles.scrollHint} href="#problema" aria-label="Seguir leyendo">
            Descubre MESA <ArrowDown size={15} />
          </a>
        </section>

        <section className={styles.problemSection} id="problema">
          <div className={styles.sectionInner}>
            <Reveal className={styles.problemCopy}>
              <span className={styles.eyebrow}>El chat de siempre, resuelto</span>
              <h2>
                De «¿dónde cenamos?» a <em>plan cerrado.</em>
              </h2>
              <p>
                Enlaces perdidos, capturas, notas y un “me da igual” detrás de
                otro. MESA convierte todo ese ruido en un espacio compartido,
                visual y fácil de decidir.
              </p>
              <ul className={styles.checkList}>
                <li>
                  <Check size={16} /> Todas las opciones juntas
                </li>
                <li>
                  <Check size={16} /> Cada grupo tiene su propia wishlist
                </li>
                <li>
                  <Check size={16} /> Más tiempo disfrutando, menos organizando
                </li>
              </ul>
            </Reveal>
            <Reveal className={styles.chatWrap} delay={0.12}>
              <ChatCard />
            </Reveal>
          </div>
        </section>

        <section className={styles.stepsSection} id="como-funciona">
          <div className={styles.narrowHeading}>
            <Reveal>
              <span className={styles.eyebrow}>Así de fácil</span>
              <h2>Tres pasos. Un plan que sí ocurre.</h2>
              <p>
                MESA está diseñada para desaparecer en cuanto empieza lo
                importante: estar juntos.
              </p>
            </Reveal>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal
                  className={styles.stepCard}
                  delay={index * 0.08}
                  key={step.number}
                >
                  <div className={styles.stepTop}>
                    <span className={styles.stepIcon}>
                      <Icon size={22} />
                    </span>
                    <span className={styles.stepNumber}>{step.number}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className={styles.featuresSection} id="dentro-de-mesa">
          <div className={styles.featuresHeading}>
            <Reveal>
              <span className={styles.eyebrow}>Todo en su sitio</span>
              <h2>Hecha para compartir el plan, no el caos.</h2>
              <p>
                Una experiencia sencilla por fuera y pensada al detalle por
                dentro.
              </p>
            </Reveal>
          </div>
          <FeatureGrid />
        </section>

        <section className={styles.storySection}>
          <div className={styles.storyPattern} aria-hidden="true" />
          <Reveal className={styles.storyCard}>
            <div className={styles.lunaWrap}>
              <MesaMark className={styles.lunaMark} />
              <span className={styles.lunaSpark}>
                <Sparkles size={18} />
              </span>
            </div>
            <div className={styles.storyCopy}>
              <span className={styles.eyebrow}>Conoce a Luna</span>
              <h2>Una app con ganas de sentarse a vuestra mesa.</h2>
              <p>
                Luna, nuestra panda roja, acompaña cada descubrimiento. MESA
                nace de algo muy sencillo: los planes compartidos merecen una
                forma más bonita de empezar.
              </p>
            </div>
            <div className={styles.storyQuote}>
              <Utensils size={24} />
              <p>“El sitio importa. La gente que se sienta contigo, más.”</p>
            </div>
          </Reveal>
        </section>

        <section className={styles.waitlistSection} id="lista">
          <Reveal className={styles.waitlistContent}>
            <span className={styles.darkEyebrow}>
              <Bell size={14} /> Tu sitio está casi listo
            </span>
            <h2>La primera ronda empieza pronto.</h2>
            <p>
              Apúntate a la beta privada. Te enviaremos una bienvenida ahora y
              otro correo cuando puedas empezar a usar MESA.
            </p>
            <div className={styles.ctaForm}>
              <WaitlistForm variant="cta" />
            </div>
          </Reveal>
        </section>

        <section className={styles.faqSection} id="preguntas">
          <Reveal className={styles.faqHeading}>
            <span className={styles.eyebrow}>Antes de sentarnos</span>
            <h2>Preguntas frecuentes</h2>
          </Reveal>
          <div className={styles.faqList}>
            <Reveal>
              <details>
                <summary>
                  ¿Cuándo estará disponible la beta?
                  <Plus size={18} />
                </summary>
                <p>
                  Estamos ultimando la primera beta privada. Las personas de la
                  lista serán las primeras en recibir la fecha y el acceso.
                </p>
              </details>
            </Reveal>
            <Reveal delay={0.04}>
              <details>
                <summary>
                  ¿En qué dispositivos podré usar MESA?
                  <Plus size={18} />
                </summary>
                <p>
                  La primera beta está pensada para Android. Más adelante
                  compartiremos novedades sobre otras plataformas.
                </p>
              </details>
            </Reveal>
            <Reveal delay={0.08}>
              <details>
                <summary>
                  ¿Apuntarme me compromete a algo?
                  <Plus size={18} />
                </summary>
                <p>
                  No. Solo recibirás información relevante sobre la beta y
                  podrás darte de baja cuando quieras.
                </p>
              </details>
            </Reveal>
            <Reveal delay={0.12}>
              <details>
                <summary>
                  ¿Podré invitar a mis amigos?
                  <Plus size={18} />
                </summary>
                <p>
                  Esa es la idea: MESA cobra vida en grupo. Te explicaremos
                  cómo invitarles cuando recibas tu acceso.
                </p>
              </details>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <MesaLogo light />
          <p>Descubrir. Guardar. Compartir. Decidir.</p>
          <a href="#inicio">
            Volver arriba <ArrowRight size={15} />
          </a>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} MESA</span>
          <span className={styles.footerMade}>
            Hecho con intención para planes de verdad.
          </span>
          <a href="/privacidad">Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
