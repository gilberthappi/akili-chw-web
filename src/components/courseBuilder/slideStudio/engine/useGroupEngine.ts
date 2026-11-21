import { Canvas as FabricCanvas, Group, ActiveSelection, util, type FabricObject } from "fabric";
import { applyFigmaControlsStyle } from "./figmaControls";

/**
 * Groups currently selected objects into a persistent Fabric.Group.
 */
export function groupActiveSelection(canvas: FabricCanvas): Group | null {
  const active = canvas.getActiveObject();
  if (!active || active.type !== "activeselection") return null;

  const activeSelection = active as ActiveSelection;
  const objects = [...activeSelection.getObjects()];
  if (objects.length < 2) return null;

  canvas.discardActiveObject();
  objects.forEach((obj) => canvas.remove(obj));

  const group = new Group(objects, {
    subTargetCheck: true,
  });

  applyFigmaControlsStyle(group);
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

/**
 * Ungroups a selected Fabric.Group back into individual canvas objects.
 */
export function ungroupActiveGroup(canvas: FabricCanvas): FabricObject[] {
  const active = canvas.getActiveObject();
  if (!active || active.type !== "group") return [];

  const group = active as Group;
  const objects = [...group.getObjects()];
  if (objects.length === 0) return [];

  canvas.remove(group);
  canvas.discardActiveObject();

  objects.forEach((item) => {
    const matrix = item.calcTransformMatrix();
    const decomposed = util.qrDecompose(matrix);

    item.set({
      left: decomposed.translateX,
      top: decomposed.translateY,
      scaleX: decomposed.scaleX,
      scaleY: decomposed.scaleY,
      angle: decomposed.angle,
    });
    item.setCoords();
    applyFigmaControlsStyle(item);
    canvas.add(item);
  });

  const sel = new ActiveSelection(objects, { canvas });
  applyFigmaControlsStyle(sel);
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
  return objects;
}
