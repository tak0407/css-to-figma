//Tells Figma to display your custom UI
figma.showUI(__html__);

//Resizes your plugin UI in pixels
figma.ui.resize(448, 648);
figma.ui.onmessage = async (msg) => {
  const { type, css } = msg;

  if (!css || typeof css !== "string") {
    figma.notify("Invalid input. Please provide valid CSS.");
    return;
  }

  try {
    const lines = css.split("\n").filter((line) => line.trim() !== "");
    if (type === "variables") {
      // 변수 생성 로직
      const collection = figma.variables.createVariableCollection("CSS Colors");
      const modeId = collection.modes[0].modeId;

      for (const line of lines) {
        const match = line.match(/--([^:]+):\s*([^;]+);/);
        if (match) {
          const variableNameRaw = match[1].trim();
          const variableValue = match[2].trim();

          const variableName = variableNameRaw.replace(/-/g, "/");
          const variable = figma.variables.createVariable(
            variableName,
            collection,
            "COLOR"
          );

          const color = hexToFigmaColor(variableValue);
          variable.setValueForMode(modeId, color);
        }
      }

      figma.notify("Variables created successfully!");
    } else if (type === "styles") {
      // 스타일 생성 로직
      for (const line of lines) {
        const match = line.match(/--([^:]+):\s*([^;]+);/);
        if (match) {
          const styleNameRaw = match[1].trim();
          const colorValue = match[2].trim();

          const styleName = styleNameRaw.replace(/-/g, "/");
          const paintStyle = figma.createPaintStyle();
          paintStyle.name = styleName;

          const color = hexToFigmaColor(colorValue);
          paintStyle.paints = [{ type: "SOLID", color }];
        }
      }

      figma.notify("Styles created successfully!");
    }
  } catch (error) {
    figma.notify("An error occurred while processing your input.");
    console.error(error);
  }

  figma.closePlugin();
};

// HEX 색상을 Figma COLOR 포맷으로 변환
function hexToFigmaColor(hex) {
  const match = hex.match(/^#([A-Fa-f0-9]{6})$/);
  if (!match) throw new Error(`Invalid hex color: ${hex}`);

  const r = parseInt(match[1].substring(0, 2), 16) / 255;
  const g = parseInt(match[1].substring(2, 4), 16) / 255;
  const b = parseInt(match[1].substring(4, 6), 16) / 255;

  return { r, g, b };
}
