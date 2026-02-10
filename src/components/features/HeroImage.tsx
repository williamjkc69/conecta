import { TITLES } from "@/constants/text";
import { ASSETS } from "@/constants/assets";

const HeroImage: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <img src={ASSETS.HERO_IMAGE} alt={TITLES.PLATFORM_NAME} />
    </div>
  );
};

export default HeroImage;
