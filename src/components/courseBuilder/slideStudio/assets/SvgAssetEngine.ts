import { loadSVGFromString, util, Group, FabricObject } from "fabric";
import { SvgColorChannel } from "./types";

/**
 * Normalizes CSS / SVG color strings to consistent uppercase hex or clean strings.
 */
function normalizeColor(color: unknown): string | null {
  if (typeof color !== "string") return null;
  const trimmed = color.trim().toLowerCase();
  if (!trimmed || trimmed === "none" || trimmed === "transparent") return null;

  // Convert 3-digit hex to 6-digit hex
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  // Convert 6-digit hex to uppercase
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Common RGB converter
  const rgbMatch = trimmed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const hex = (n: string) => Number(n).toString(16).padStart(2, "0").toUpperCase();
    return `#${hex(rgbMatch[1])}${hex(rgbMatch[2])}${hex(rgbMatch[3])}`;
  }

  return trimmed;
}

/**
 * SvgAssetEngine - High-performance multi-color vector asset parser and recolorizer.
 * Decomposes SVGs into sub-path layers, indexes distinct color channels, and enables
 * real-time sub-path recoloring from the property inspector.
 */
export class SvgAssetEngine {
  /**
   * Loads an SVG string into a grouped Fabric.js object, scales it appropriately,
   * and indexes all sub-path color channels.
   */
  static async loadSvgIntoGroup(
    svgString: string,
    targetSize: number = 140,
    name: string = "Vector Graphic"
  ): Promise<Group> {
    const { objects, options } = await loadSVGFromString(svgString);
    const validObjects = objects.filter((o): o is FabricObject => Boolean(o));

    const group = util.groupSVGElements(validObjects, options) as Group;

    // Scale to target size while preserving aspect ratio
    const maxDim = Math.max(group.width || 24, group.height || 24);
    if (maxDim > 0) {
      const scale = targetSize / maxDim;
      group.scale(scale);
    }

    // Set custom metadata for Slide Studio
    (group as any).isSvgAsset = true;
    (group as any).customType = "svg-asset";
    (group as any).svgName = name;
    (group as any).originalSvgString = svgString;

    // Extract and bind color channels
    this.extractAndBindChannels(group);

    return group;
  }

  /**
   * Recursively traverses group elements and discovers all unique fill and stroke colors.
   */
  static extractAndBindChannels(group: Group): SvgColorChannel[] {
    const channelMap = new Map<
      string,
      {
        originalColor: string;
        currentColor: string;
        targets: Array<{ obj: FabricObject; prop: "fill" | "stroke" }>;
      }
    >();

    const traverse = (obj: FabricObject) => {
      // Check Fill
      const fill = normalizeColor(obj.fill);
      if (fill) {
        if (!channelMap.has(fill)) {
          channelMap.set(fill, {
            originalColor: fill,
            currentColor: fill,
            targets: [],
          });
        }
        channelMap.get(fill)!.targets.push({ obj, prop: "fill" });
      }

      // Check Stroke
      if (obj.stroke && (obj.strokeWidth || 0) > 0) {
        const stroke = normalizeColor(obj.stroke);
        if (stroke) {
          if (!channelMap.has(stroke)) {
            channelMap.set(stroke, {
              originalColor: stroke,
              currentColor: stroke,
              targets: [],
            });
          }
          channelMap.get(stroke)!.targets.push({ obj, prop: "stroke" });
        }
      }

      // Nested Groups
      if ("_objects" in obj && Array.isArray((obj as any)._objects)) {
        (obj as any)._objects.forEach(traverse);
      }
    };

    if (group._objects && Array.isArray(group._objects)) {
      group._objects.forEach(traverse);
    }

    // Convert to SvgColorChannel array
    const channels: SvgColorChannel[] = [];
    let idx = 0;

    channelMap.forEach((entry, colorKey) => {
      channels.push({
        id: `channel-${idx++}-${colorKey.replace(/[^a-zA-Z0-9]/g, "")}`,
        originalColor: entry.originalColor,
        currentColor: entry.currentColor,
        count: entry.targets.length,
      });
    });

    // Cache internal targets map for instant recoloring
    (group as any)._svgChannelTargets = channelMap;
    (group as any).colorChannels = channels;

    return channels;
  }

  /**
   * Retrieves the current color channels on an SVG group.
   */
  static getChannels(group: Group): SvgColorChannel[] {
    if ((group as any).colorChannels) {
      return (group as any).colorChannels;
    }
    return this.extractAndBindChannels(group);
  }

  /**
   * Recolors all vector sub-paths belonging to a specific color channel.
   */
  static recolorChannel(
    group: Group,
    channelId: string,
    newColor: string
  ): void {
    if (!group) return;

    const channels: SvgColorChannel[] = this.getChannels(group);
    const targetChannel = channels.find((c) => c.id === channelId);
    if (!targetChannel) return;

    const channelMap = (group as any)._svgChannelTargets as
      | Map<
          string,
          {
            originalColor: string;
            currentColor: string;
            targets: Array<{ obj: FabricObject; prop: "fill" | "stroke" }>;
          }
        >
      | undefined;

    if (channelMap) {
      const entry = channelMap.get(targetChannel.originalColor);
      if (entry) {
        entry.currentColor = newColor;
        entry.targets.forEach(({ obj, prop }) => {
          obj.set(prop, newColor);
          obj.dirty = true;
        });
      }
    }

    targetChannel.currentColor = newColor;
    group.dirty = true;
    if (group.canvas) {
      group.canvas.requestRenderAll();
    }
  }

  /**
   * Restores all sub-paths in the SVG group back to their original vector colors.
   */
  static resetColors(group: Group): void {
    if (!group) return;

    const channels = this.getChannels(group);
    channels.forEach((channel) => {
      this.recolorChannel(group, channel.id, channel.originalColor);
    });
  }
}

