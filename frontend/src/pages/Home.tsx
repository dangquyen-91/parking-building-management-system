import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import PackageSection from '../components/sections/PackageSection';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <PackageSection isPreview={true} />
      <CTASection />
    </>
  );
}
