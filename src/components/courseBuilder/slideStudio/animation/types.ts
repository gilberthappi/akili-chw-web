// Slide Studio - Animation & Transition Engine Types

export type AnimationPreset =
  | "none"
  | "fade-in"
  | "slide-in-up"
  | "slide-in-down"
  | "slide-in-left"
  | "slide-in-right"
  | "pop-in"
  | "bounce-in"
  | "flip-in";

export type SlideTransitionType =
  | "none"
  | "fade"
  | "slide-left"
  | "slide-up"
  | "zoom";

export type AnimationEasing =
  | "linear"
  | "easeOutQuad"
  | "easeOutBack"
  | "easeInOutCubic";

export interface ElementAnimationConfig {
  preset: AnimationPreset;
  duration: number; // in milliseconds (e.g. 500)
  delay: number; // in milliseconds (e.g. 0)
  order: number; // sequence index (1, 2, 3...)
  easing?: AnimationEasing;
}

export interface SlideAnimationSettings {
  transition: SlideTransitionType;
  transitionDuration: number; // ms
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // ms
}

export const DEFAULT_ANIMATION_CONFIG: ElementAnimationConfig = {
  preset: "none",
  duration: 500,
  delay: 0,
  order: 1,
  easing: "easeOutQuad",
};

export const DEFAULT_SLIDE_ANIMATION_SETTINGS: SlideAnimationSettings = {
  transition: "fade",
  transitionDuration: 400,
  autoAdvance: false,
};

export interface AnimationPresetMeta {
  id: AnimationPreset;
  label: string;
  description: string;
  iconName: string;
}

export const CURATED_ANIMATION_PRESETS: AnimationPresetMeta[] = [
  {
    id: "none",
    label: "None",
    description: "Appears immediately with slide",
    iconName: "Ban",
  },
  {
    id: "fade-in",
    label: "Fade In",
    description: "Smooth linear opacity entrance",
    iconName: "Eye",
  },
  {
    id: "slide-in-up",
    label: "Slide Up",
    description: "Rises from bottom into position",
    iconName: "ArrowUp",
  },
  {
    id: "slide-in-down",
    label: "Slide Down",
    description: "Enters from top into position",
    iconName: "ArrowDown",
  },
  {
    id: "slide-in-left",
    label: "Slide Left",
    description: "Slides in from the left edge",
    iconName: "ArrowRight",
  },
  {
    id: "slide-in-right",
    label: "Slide Right",
    description: "Slides in from the right edge",
    iconName: "ArrowLeft",
  },
  {
    id: "pop-in",
    label: "Pop In",
    description: "Scales up dynamically with punch",
    iconName: "Maximize2",
  },
  {
    id: "bounce-in",
    label: "Bounce In",
    description: "Playful overshoot elastic entrance",
    iconName: "Sparkles",
  },
  {
    id: "flip-in",
    label: "Flip In",
    description: "3D card flip revelation",
    iconName: "RotateCw",
  },
];
