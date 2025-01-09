// code.ts

// Figma에게 커스텀 UI를 표시하라고 지시
figma.showUI(__html__);

// 플러그인 UI의 크기를 픽셀 단위로 조정
figma.ui.resize(448, 648);

// 메시지 타입 정의
type Message = {
  type: "variables" | "styles";
  css: string;
};

// 메시지 수신 처리
figma.ui.onmessage = async (msg: Message) => {
  const { type, css } = msg;

  if (!css || typeof css !== "string") {
    figma.notify("Invalid input. Please provide valid CSS.");
    return;
  }

  try {
    const lines: string[] = css
      .split("\n")
      .filter((line) => line.trim() !== "");
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

          const { color, opacity } = hexToFigmaColor(variableValue);
          // 수정된 부분: Figma 변수 값 형식에 맞게 변경
          variable.setValueForMode(modeId, {
            r: color.r,
            g: color.g,
            b: color.b,
            a: opacity,
          });
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

          const { color, opacity } = hexToFigmaColor(colorValue);
          paintStyle.paints = [{ type: "SOLID", color, opacity }];
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

// HEX 색상을 Figma RGBA COLOR 포맷으로 변환

// HEX 색상을 Figma RGBA COLOR 포맷으로 변환
function hexToFigmaColor(colorValue: string): { color: RGB; opacity: number } {
  // RGBA 형식 확인
  const rgbaMatch = colorValue.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
  );
  if (rgbaMatch) {
    return rgbaToFigmaColor(rgbaMatch);
  }

  // HEX 형식 처리
  const shortHexMatch = colorValue.match(/^#([A-Fa-f0-9]{3})$/);
  const longHexMatch = colorValue.match(/^#([A-Fa-f0-9]{6})$/);
  const longHexAlphaMatch = colorValue.match(/^#([A-Fa-f0-9]{8})$/);

  let r: number,
    g: number,
    b: number,
    opacity: number = 1;

  if (shortHexMatch) {
    const [rShort, gShort, bShort] = shortHexMatch[1].split("");
    r = parseInt(rShort + rShort, 16) / 255;
    g = parseInt(gShort + gShort, 16) / 255;
    b = parseInt(bShort + bShort, 16) / 255;
  } else if (longHexMatch) {
    r = parseInt(longHexMatch[1].substring(0, 2), 16) / 255;
    g = parseInt(longHexMatch[1].substring(2, 4), 16) / 255;
    b = parseInt(longHexMatch[1].substring(4, 6), 16) / 255;
  } else if (longHexAlphaMatch) {
    r = parseInt(longHexAlphaMatch[1].substring(0, 2), 16) / 255;
    g = parseInt(longHexAlphaMatch[1].substring(2, 4), 16) / 255;
    b = parseInt(longHexAlphaMatch[1].substring(4, 6), 16) / 255;
    opacity = parseInt(longHexAlphaMatch[1].substring(6, 8), 16) / 255;
  } else {
    throw new Error(`유효하지 않은 색상 형식입니다: ${colorValue}`);
  }

  return {
    color: { r, g, b },
    opacity,
  };
}

// RGBA 문자열을 Figma COLOR 포맷으로 변환
function rgbaToFigmaColor(match: RegExpMatchArray): {
  color: RGB;
  opacity: number;
} {
  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;
  const opacity = match[4] ? parseFloat(match[4]) : 1;

  return {
    color: { r, g, b },
    opacity,
  };
}
