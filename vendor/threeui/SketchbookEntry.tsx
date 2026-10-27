// Verbatim registered export from LandingPages.tsx, with only its required
// imports. The complete original catalog source remains unchanged alongside
// this entry; unrelated pages and raw-scene imports are not bundled.
import { splitTypographyProps, usePageTypography, type PageTypographyProps } from "./src/shaders/landing-pages/pageTypography";
import { LandingPageFrame, type LandingPageProps } from "./src/shaders/landing-pages/LandingPageFrame";
import { MENG_TO_SKETCHBOOK_TYPOGRAPHY } from "./src/shaders/landing-pages/pageRecipes";

export function MengToSketchbookLandingPage(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(MENG_TO_SKETCHBOOK_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="Meng To — Singapore Sketchbook" sourceUrl="/landing-pages/meng-to-sketchbook.html" />;
}
