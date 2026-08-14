import { ButtonLink, Container } from "@/frontend/components/ui";

export default function NotFound() {
  return (
    <section className="bg-carbon-950 py-40">
      <Container className="text-center">
        <p className="font-display text-7xl font-extrabold text-brand-500 sm:text-8xl">
          404
        </p>
        <h1 className="title-xl mt-6 text-3xl text-white sm:text-4xl">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-4 max-w-md text-carbon-300">
          El enlace puede estar roto o la página fue movida. Volvamos a terreno
          conocido.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Ir al inicio</ButtonLink>
          <ButtonLink href="/contacto" variant="ghostLight">
            Contactar
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
