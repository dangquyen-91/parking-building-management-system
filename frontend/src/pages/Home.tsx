import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import StatsSection from '../components/sections/StatsSection';
import PackageSection from '../components/sections/PackageSection';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsSection />
      <PackageSection isPreview={true} />
      <CTASection />
    </>
  );
}
