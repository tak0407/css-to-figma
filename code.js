//Tells Figma to display your custom UI
figma.showUI(__html__);

//Resizes your plugin UI in pixels
figma.ui.resize(448, 600);
figma.ui.onmessage = async (msg) => {
  const cssText = msg;

  // Variables API 지원 여부 확인
  if (
    !figma.variables ||
    typeof figma.variables.createVariableCollection !== "function"
  ) {
    figma.notify("Variables API is not supported in this environment.");
    figma.closePlugin();
    return;
  }

  if (!cssText || typeof cssText !== "string") {
    figma.notify("Invalid input. Please provide valid CSS variables.");
    return;
  }

  try {
    // Step 1: CSS 변수 파싱
    const lines = cssText.split("\n").filter((line) => line.trim() !== "");
    const collection = figma.variables.createVariableCollection("CSS Colors");
    const modeId = collection.modes[0].modeId; // 기본적으로 단일 모드(Value)

    for (const line of lines) {
      const match = line.match(/--([^:]+):\s*([^;]+);/);
      if (match) {
        const variableNameRaw = match[1].trim();
        const variableValue = match[2].trim();

        // 슬래시 구조로 Variable 이름 변환
        const variableName = variableNameRaw.replace(/-/g, "/");
        const variable = figma.variables.createVariable(
          variableName,
          collection,
          "COLOR"
        );

        // HEX 색상 변환 후 모드 값 설정!
        const color = hexToFigmaColor(variableValue);
        variable.setValueForMode(modeId, color);
      }
    }

    figma.notify("Variables created successfully in single mode!");
  } catch (error) {
    figma.notify("An error occurred while processing variables.");
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
