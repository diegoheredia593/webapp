import Link from "next/link";
import { notFound } from "next/navigation";
import { withTerms } from "@/components/glossary/withTerms";
import { LeadForm } from "@/components/LeadForm";
import { PlansSpotlight } from "@/components/PlansSpotlight";
import { AvatarPlaceholder, HeroFigure, QrPlaceholder } from "@/components/Placeholders";
import { StoreButtons } from "@/components/StoreButtons";
import { getDictionary, isLocale, locales } from "@/content/dictionary";
import { href } from "@/content/routes";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const FEATURED_PLAN = "Plus";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      {/* ── Portada: un foco, una acción ──────────────────────────────── */}
      <div className="wrap">
        <div className="hero">
          <div className="stack-24">
            <span className="tag">{dict.hero.kicker.join(" · ")}</span>
            <h1 className="display">
              {dict.hero.titleTop}
              <br />
              {dict.hero.titleBottom}
            </h1>
            <p className="lead">{dict.hero.lead}</p>
            <div className="hero__actions">
              <Link href={href(locale, "/#descargar")} className="btn btn--primary">
                {dict.hero.cta}
              </Link>
              <Link href={href(locale, "/#descargar")} className="link">
                {dict.hero.secondaryCta}
              </Link>
            </div>
          </div>

          <HeroFigure brief={dict.hero.figureBrief} />
        </div>

        {/* Confianza: una línea, sin tarjetas */}
        <div className="trust">
          {dict.hero.trust.map((body, i) => (
            <div key={body}>
              <span className="n">{`0${i + 1}`}</span>
              <p className="caption">{withTerms(body)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cómo funciona: filas con filete, no tarjetas ──────────────── */}
      <section id="como" className="section">
        <div className="wrap">
          <div className="head">
            <span className="tag">{dict.steps.eyebrow}</span>
            <h2>{dict.steps.title}</h2>
            <p className="lead">{dict.steps.lead}</p>
          </div>

          <div className="list">
            {dict.steps.items.map((step, i) => (
              <div key={step.title} className="list__item">
                <span className="n">{`0${i + 1}`}</span>
                <h3>{step.title}</h3>
                <p className="body-s">{withTerms(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── La cuenta: seis piezas en dos columnas ────────────────────── */}
      <section id="cuenta" className="section rule">
        <div className="wrap">
          <div className="head">
            <span className="tag">{dict.features.eyebrow}</span>
            <h2>{dict.features.title}</h2>
          </div>

          <div className="duo">
            {dict.features.items.map((feature) => (
              <div key={feature.title} className="duo__item">
                <span className="tag">{feature.tag}</span>
                <h4>{feature.title}</h4>
                <p className="body-s">{withTerms(feature.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cifras: lo único a sangre ─────────────────────────────────── */}
      <section className="figures">
        <div className="wrap">
          <div className="figures__grid">
            {dict.stats.map((stat) => (
              <div key={stat.figure}>
                <div className="n">{stat.figure}</div>
                <div className="sep" />
                <p>{withTerms(stat.label, "dark")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ───────────────────────────────────────────────────── */}
      <section id="precios" className="section">
        <div className="wrap">
          <div className="head">
            <span className="tag">{dict.pricing.eyebrow}</span>
            <h2>{dict.pricing.title}</h2>
            <p className="lead">{dict.pricing.lead}</p>
          </div>

          <PlansSpotlight>
            <div className="plans">
              {dict.pricing.plans.map((plan) => {
                const featured = plan.name === FEATURED_PLAN;
                return (
                  <div key={plan.name} className={`plan${featured ? " plan--featured" : ""}`}>
                    <span className="tag tag--strong">
                      {plan.name}
                      {featured ? ` · ${dict.pricing.popular}` : ""}
                    </span>
                    <div className="plan__price">{plan.price}</div>
                    <p className="body-s">{plan.pitch}</p>
                    <ul>
                      {plan.items.map((item) => (
                        <li key={item}>
                          <span>{withTerms(item)}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Solo el plan destacado lleva la acción en óxido */}
                    <Link
                      href={href(locale, "/#descargar")}
                      className={`btn btn--block ${featured ? "btn--primary" : "btn--ghost"}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </PlansSpotlight>

          <p className="caption" style={{ marginTop: "var(--s-24)" }}>
            {dict.pricing.feesNote}{" "}
            <Link href={href(locale, "/tarifas")} className="link">
              {dict.pricing.feesLink}
            </Link>
          </p>
        </div>
      </section>

      {/* ── Testimonio y seguridad ────────────────────────────────────── */}
      <section id="seguridad" className="section rule">
        <div className="wrap">
          <div className="hero split-top">
            <div className="stack-24">
              <span className="tag">{dict.testimonial.eyebrow}</span>
              <blockquote className="quote">“{dict.testimonial.quote}”</blockquote>
              <div style={{ display: "flex", gap: "var(--s-16)", alignItems: "center" }}>
                <AvatarPlaceholder />
                <p className="caption">
                  {dict.testimonial.author}
                  <br />
                  {dict.testimonial.detail}
                </p>
              </div>
            </div>

            <div className="list list--plain">
              {dict.testimonial.security.map((item) => (
                <div key={item.title} className="list__item">
                  <h4>{item.title}</h4>
                  <p className="body-s">{withTerms(item.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Descarga: el final del embudo ─────────────────────────────── */}
      <section id="descargar" className="section rule">
        <div className="wrap">
          <div className="head">
            <span className="tag">{dict.download.eyebrow}</span>
            <h2>{dict.download.title}</h2>
            <p className="lead">{dict.download.lead}</p>
          </div>

          <div className="download">
            <div className="stack-24">
              <StoreButtons dict={dict} />

              {/* Desde el ordenador no se puede instalar: se envía el enlace. */}
              <div
                className="stack-16"
                style={{ paddingTop: "var(--s-32)", borderTop: "1px solid var(--hairline)" }}
              >
                <h4>{dict.download.deskTitle}</h4>
                <p className="body-s" style={{ maxWidth: "42ch" }}>
                  {dict.download.deskNote}
                </p>
                <LeadForm dict={dict} />
              </div>
            </div>

            <div className="stack-16">
              <span className="tag">{dict.download.qrNote}</span>
              <QrPlaceholder brief={dict.download.qrBrief} />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
