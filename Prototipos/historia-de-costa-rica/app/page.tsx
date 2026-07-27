import { CinematicStory } from "./components/experience";
import { MainContent } from "./components/sections/Sections";

export default function HomePage() {
  return (
    <main className="hdc-main">
      {/* Portada cinemática · los cuatro actos (árbol → umbral → esfera → cartas). */}
      <CinematicStory />
      {/* Secciones de la página única. */}
      <MainContent />
    </main>
  );
}
