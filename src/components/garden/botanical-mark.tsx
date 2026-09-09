import { useId } from "react";
import type { MarkerKind } from "@/lib/memories/types";

export function BotanicalMark({
  kind,
  favorite = false,
  className,
}: {
  kind: MarkerKind;
  favorite?: boolean;
  className?: string;
}) {
  const uid = useId();
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      {kind === "flower" ? <Flower favorite={favorite} uid={uid} /> : null}
      {kind === "leaf" ? <Leaf favorite={favorite} uid={uid} /> : null}
      {kind === "stone" ? <Stone favorite={favorite} uid={uid} /> : null}
      {kind === "sprout" ? <Sprout favorite={favorite} uid={uid} /> : null}
    </svg>
  );
}

/** Shared base shadow: a soft, slightly offset ellipse that grounds each mark. */
function BaseShadow({ uid }: { uid: string }) {
  return <ellipse cx="33" cy="76" rx="10" ry="2.4" fill={`url(#${uid}-ground)`} />;
}

function GroundGradient({ uid }: { uid: string }) {
  return (
    <radialGradient id={`${uid}-ground`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#2E3B2A" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#2E3B2A" stopOpacity="0" />
    </radialGradient>
  );
}

function Flower({ favorite, uid }: { favorite: boolean; uid: string }) {
  const petalLight = favorite ? "#F1B78E" : "#A0B899";
  const petalDark = favorite ? "#D3925F" : "#7E9678";
  const inner = favorite ? "#F6E3A3" : "#EFC08E";
  const innerDeep = favorite ? "#E0B562" : "#D89A5F";
  return (
    <g>
      <defs>
        <GroundGradient uid={uid} />
        <radialGradient id={`${uid}-petal`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={petalLight} />
          <stop offset="100%" stopColor={petalDark} />
        </radialGradient>
        <radialGradient id={`${uid}-inner`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={inner} />
          <stop offset="100%" stopColor={innerDeep} />
        </radialGradient>
      </defs>
      <BaseShadow uid={uid} />
      <path
        d="M32 78 C31 58 33 50 32 42"
        fill="none"
        stroke="#4F6A57"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {[0, 72, 144, 216, 288].map((deg, index) => (
        <ellipse
          key={deg}
          cx="32"
          cy="28"
          rx="7"
          ry="14"
          fill={`url(#${uid}-petal)`}
          opacity={index === 0 ? 1 : 0.9 - index * 0.015}
          transform={`rotate(${deg} 32 28)`}
        />
      ))}
      <circle cx="32" cy="28" r="5.5" fill={`url(#${uid}-inner)`} />
      <circle cx="30.3" cy="26.3" r="1.4" fill="#FFF8E7" opacity="0.7" />
    </g>
  );
}

function Leaf({ favorite, uid }: { favorite: boolean; uid: string }) {
  const light = favorite ? "#89A67F" : "#A6BE9E";
  const dark = favorite ? "#526E4C" : "#6F8F6A";
  return (
    <g>
      <defs>
        <GroundGradient uid={uid} />
        <linearGradient id={`${uid}-leaf`} x1="8" y1="10" x2="52" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <BaseShadow uid={uid} />
      <path
        d="M32 78 C31 62 32 54 32 46"
        fill="none"
        stroke="#4F6A57"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M32 48 C18 40 14 22 32 10 C50 22 46 40 32 48 Z" fill={`url(#${uid}-leaf)`} />
      <path
        d="M32 46 C32 34 32 22 32 14"
        fill="none"
        stroke="#FBF7EF"
        strokeWidth="1.2"
        opacity="0.65"
      />
      <path d="M20 24 C24 20 28 16 32 12" fill="none" stroke="#FBF7EF" strokeWidth="0.8" opacity="0.3" />
    </g>
  );
}

function Stone({ favorite, uid }: { favorite: boolean; uid: string }) {
  const top = favorite ? "#CFC3E2" : "#E7E0D4";
  const bottom = favorite ? "#9C8FB4" : "#C4B9A5";
  return (
    <g>
      <defs>
        <GroundGradient uid={uid} />
        <radialGradient id={`${uid}-stone`} cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </radialGradient>
      </defs>
      <BaseShadow uid={uid} />
      <ellipse cx="32" cy="58" rx="18" ry="11" fill={favorite ? "#8E82A6" : "#B8AE9A"} opacity="0.55" />
      <ellipse cx="32" cy="56" rx="16" ry="9.5" fill={`url(#${uid}-stone)`} />
      <ellipse cx="25" cy="53" rx="4.5" ry="2.2" fill="#FFFDF8" opacity="0.55" />
    </g>
  );
}

function Sprout({ favorite, uid }: { favorite: boolean; uid: string }) {
  const leftLight = favorite ? "#F1B78E" : "#A6BE9E";
  const leftDark = favorite ? "#D3925F" : "#6F8F6A";
  const rightLight = favorite ? "#F6E3A3" : "#89A67F";
  const rightDark = favorite ? "#D3A34F" : "#4F6A57";
  return (
    <g>
      <defs>
        <GroundGradient uid={uid} />
        <linearGradient id={`${uid}-leafL`} x1="14" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={leftLight} />
          <stop offset="100%" stopColor={leftDark} />
        </linearGradient>
        <linearGradient id={`${uid}-leafR`} x1="50" y1="18" x2="32" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={rightLight} />
          <stop offset="100%" stopColor={rightDark} />
        </linearGradient>
      </defs>
      <BaseShadow uid={uid} />
      <path
        d="M32 78 C32 60 32 50 32 40"
        fill="none"
        stroke="#4F6A57"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M32 48 C20 44 16 32 24 24 C28 34 30 40 32 48 Z" fill={`url(#${uid}-leafL)`} />
      <path d="M32 46 C44 40 50 30 42 22 C38 32 34 40 32 46 Z" fill={`url(#${uid}-leafR)`} />
    </g>
  );
}
