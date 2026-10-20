import {
  controlsUtils,
  Control,
  type FabricObject,
} from "fabric";

/**
 * Custom control styling for Fabric.js v7 objects.
 * Matches modern Figma / Canva aesthetics:
 * - White circular/rounded anchor pills with subtle borders and shadows.
 * - Smooth lollipop rotation handle.
 * - Uniform scaling on corner handles.
 */
export function applyFigmaControlsStyle(obj: FabricObject) {
  obj.transparentCorners = false;
  obj.cornerColor = "#ffffff";
  obj.cornerStrokeColor = "#2563eb"; // Blue 600
  obj.cornerSize = 10;
  obj.cornerStyle = "circle";
  obj.borderColor = "#3b82f6"; // Blue 500
  obj.borderScaleFactor = 1.5;
  obj.borderDashArray = undefined;
  obj.padding = 4;

  // Custom rotation control setup (lollipop above top center)
  const rotationControl = new Control({
    x: 0,
    y: -0.5,
    offsetY: -26,
    cursorStyler: controlsUtils.rotationStyleHandler,
    actionHandler: controlsUtils.rotationWithSnapping,
    actionName: "rotate",
    render: (ctx, left, top, _styleOverride, fabricObj) => {
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate((fabricObj.angle * Math.PI) / 180);

      // Connecting stem line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 26);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotation circular head
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    },
  });

  // Assign rotation control
  obj.controls.mtr = rotationControl;
}
