
import { GlowButton } from "./GlowButton";

export { GlowButton };
import { FaGoogle, FaApple } from "react-icons/fa";
import { Sparkles } from "lucide-react";

export function GoogleButton(props: React.ComponentProps<"button">) {
  return (
    <GlowButton {...props} className="w-full flex items-center gap-2 justify-center">
      <FaGoogle className="text-lg" />
      <span>Connexion Google</span>
    </GlowButton>
  );
}

export function AppleButton(props: React.ComponentProps<"button">) {
  return (
    <GlowButton {...props} className="w-full flex items-center gap-2 justify-center">
      <FaApple className="text-lg" />
      <span>Connexion Apple</span>
    </GlowButton>
  );
}

export function MagicLinkButton(props: React.ComponentProps<"button">) {
  return (
    <GlowButton {...props} className="w-full flex items-center gap-2 justify-center">
      <Sparkles className="text-lg" />
      <span>Connexion magique</span>
    </GlowButton>
  );
}

export function PrimaryButton(props: React.ComponentProps<"button">) {
  return (
    <GlowButton {...props} className="w-full">
      {props.children}
    </GlowButton>
  );
}
