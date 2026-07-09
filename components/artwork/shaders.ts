export const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

// blurSamples is baked in as a compile-time constant (8 desktop, 4 Safari)
// so the radial-blur loop can still unroll
export const createFragmentShader = (blurSamples: number): string => /* glsl */ `
const int BLUR_SAMPLES = ${blurSamples};

uniform sampler2D uImageAtlas;
uniform sampler2D uLayout;
uniform sampler2D uActiveVideoTexture;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uZoom;
uniform float uDistortion;
uniform float uRadialBlurIntensity;
uniform float uAtlasSize;
uniform float uNumColumns;
uniform float uLayoutRows;
uniform vec2 uHoveredCell;
uniform float uHoverIntensity;
uniform vec2 uPrevHoveredCell;
uniform float uPrevHoverIntensity;
uniform float uShineProgress;
uniform vec2 uActiveVideoCell;
uniform float uIntroProgress;
uniform vec2 uIntroCenter;

varying vec2 vUv;

const float COLUMN_WIDTH = 1.0;
const float CELL_GAP = 0.06;
const float LAYOUT_WIDTH = 64.0;
// hover frame: on hover the image scales down UNIFORMLY about the cell center
// (aspect ratio is preserved exactly at every intensity) and a constant-
// thickness white ring hugs the scaled image edge, flush against it — no
// gap. All sizes are world units (columnWidth = 1); world axes scale uniformly
// to screen, so the ring reads with even thickness on all four sides.
const float BORDER_WIDTH = 0.0115;
const float FRAME_AA = 0.003;
const float VIGNETTE_INTENSITY = 0.7;
const float VIGNETTE_RADIUS = 1.3;
const float VIGNETTE_SOFTNESS = 0.5;
const vec3 BACKGROUND = vec3(0.008);

// frame color (linear-light; sRGB conversion happens later in
// colorspace_fragment): plain white
const vec3 FRAME_COLOR = vec3(1.0);

vec4 layoutTexel(float x, float row) {
  return texture2D(uLayout, vec2((x + 0.5) / LAYOUT_WIDTH, (row + 0.5) / uLayoutRows));
}

vec3 sampleGrid(vec2 world) {
  float wx = mod(world.x, uNumColumns * COLUMN_WIDTH);
  float col = clamp(floor(wx / COLUMN_WIDTH), 0.0, uNumColumns - 1.0);
  float localX = wx - col * COLUMN_WIDTH;

  vec4 meta = layoutTexel(col, 0.0);
  float columnHeight = meta.r;
  float cellCount = meta.b;
  float wy = mod(world.y + meta.g, columnHeight);

  // binary search: last cell whose y <= wy (<=7 steps covers 64 cells/column)
  float lo = 0.0;
  float hi = cellCount - 1.0;
  for (int i = 0; i < 7; i++) {
    if (lo >= hi) break;
    float mid = ceil((lo + hi) * 0.5);
    if (layoutTexel(mid, col + 1.0).r <= wy) {
      lo = mid;
    } else {
      hi = mid - 1.0;
    }
  }
  vec4 cell = layoutTexel(lo, col + 1.0);
  float cellY = cell.r;
  float cellH = cell.g;
  float imageIndex = cell.b;
  float isVideo = cell.a;

  vec2 cellPos = vec2(localX, wy - cellY);
  float g = CELL_GAP * 0.5;
  if (cellPos.x < g || cellPos.x > COLUMN_WIDTH - g || cellPos.y < g || cellPos.y > cellH - g) {
    return BACKGROUND;
  }

  // hover state for this cell (driven per-frame by GalleryRenderer.updateHover)
  float hover = 0.0;
  if (abs(col - uHoveredCell.x) < 0.5 && abs(lo - uHoveredCell.y) < 0.5) {
    hover = uHoverIntensity;
  }
  float prevHover = 0.0;
  if (abs(col - uPrevHoveredCell.x) < 0.5 && abs(lo - uPrevHoveredCell.y) < 0.5) {
    prevHover = uPrevHoverIntensity;
  }

  // hover frame geometry: the image scales down UNIFORMLY about the cell
  // center by s = 1 - 2*t / min(visW, visH), where t is the frame thickness
  // eased by hover intensity — so on the cell's SHORTER axis the freed space
  // is exactly t and the frame sits flush against the visible cell edge,
  // while on the longer axis it frees more than t; the surplus beyond the
  // frame's outer edge stays BACKGROUND and merges with the inter-cell gap
  // (the frame follows the picture, not the cell). Uniform scale means zero
  // aspect distortion at every intensity (identity while intensities are 0).
  float frameIntensity = max(hover, prevHover);
  float t = BORDER_WIDTH * frameIntensity;

  // cell height in world units == aspect (columnWidth = 1), so full-cell UV
  // reproduces the image's true aspect from its squished square atlas cell
  vec2 cellSize = vec2(COLUMN_WIDTH, cellH);
  vec2 visSize = cellSize - 2.0 * g;
  vec2 center = cellSize * 0.5;
  float s = 1.0 - 2.0 * t / min(visSize.x, visSize.y);
  vec2 samplePos = center + (cellPos - center) / s;
  vec2 cellUv = samplePos / cellSize;

  // intro radial stagger: cells zoom 1.25→1 and fade from black, delayed by
  // this on-screen instance's world distance from the viewport center at
  // intro start, ease-out-quint; identity once uIntroProgress reaches 1
  float introT = 1.0;
  if (uIntroProgress < 1.0) {
    vec2 cellCenter = vec2(world.x - cellPos.x + COLUMN_WIDTH * 0.5, world.y - cellPos.y + cellH * 0.5);
    float delay = min(distance(cellCenter, uIntroCenter) * 0.22, 0.6);
    introT = clamp((uIntroProgress - delay) / 0.4, 0.0, 1.0);
    introT = 1.0 - pow(1.0 - introT, 5.0);
    cellUv = (cellUv - 0.5) / mix(1.25, 1.0, introT) + 0.5;
  }

  float atlasCol = mod(imageIndex, uAtlasSize);
  float atlasRow = floor(imageIndex / uAtlasSize);
  vec2 atlasUv = (vec2(atlasCol, atlasRow) + cellUv) / uAtlasSize;
  atlasUv.y = 1.0 - atlasUv.y;

  vec3 color = texture2D(uImageAtlas, atlasUv).rgb;

  // hovered video cell crossfades to uActiveVideoTexture over the atlas first
  // frame (by hover intensity) so playback doesn't pop in
  if (isVideo > 0.5 && abs(col - uActiveVideoCell.x) < 0.5 && abs(lo - uActiveVideoCell.y) < 0.5) {
    color = mix(color, texture2D(uActiveVideoTexture, cellUv).rgb, hover);
  }

  // shine sweep, one pass per hover-enter via uShineProgress
  if (hover > 0.001) {
    float band = cellUv.x + cellUv.y * 0.6;
    float pos = mix(-0.6, 1.6, uShineProgress);
    float shine = smoothstep(0.25, 0.0, abs(band - pos)) * (1.0 - uShineProgress * uShineProgress);
    color += shine * 0.45 * hover;
  }

  // frame: a constant-thickness ring (t on all four sides, square
  // corners) hugging the scaled image edge, flush against it — no gap.
  // Opacity follows this cell's hover intensity so it collapses on the
  // previous cell while it grows on the new one.
  if (frameIntensity > 0.001) {
    // signed distance from the scaled image rect edge (positive outside),
    // in world units — max(q) gives even edge bands with square corners
    vec2 q = abs(cellPos - center) - s * visSize * 0.5;
    float d = max(q.x, q.y);
    float pastImage = smoothstep(-FRAME_AA, FRAME_AA, d);
    float insideOuter = 1.0 - smoothstep(t - FRAME_AA, t + FRAME_AA, d);
    color = mix(color, FRAME_COLOR, pastImage * insideOuter * frameIntensity);
    // beyond the frame's outer edge (longer-axis surplus): background, so it
    // merges with the inter-cell gap
    color = mix(color, BACKGROUND, pastImage * (1.0 - insideOuter));
  }

  return color * introT;
}

// barrel distortion → aspect correction → zoom → drag offset
vec2 ndcToWorld(vec2 ndc) {
  float r2 = dot(ndc, ndc);
  vec2 duv = ndc * (1.0 - uDistortion * r2);
  vec2 world;
  world.x = duv.x * (uResolution.x / uResolution.y);
  world.y = -duv.y;
  return world * uZoom + uOffset;
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;

  vec3 color = sampleGrid(ndcToWorld(ndc));

  // radial blur, edge-masked beyond VIGNETTE_RADIUS - 0.3 so most pixels keep
  // the single-sample path above (blurFactor early-out)
  float blurFactor = smoothstep(VIGNETTE_RADIUS - 0.3, VIGNETTE_RADIUS, length(ndc)) * uRadialBlurIntensity;
  if (blurFactor >= 0.01) {
    // BLUR_SAMPLES total: extra taps stepping toward the screen center
    for (int i = 1; i < BLUR_SAMPLES; i++) {
      color += sampleGrid(ndcToWorld(ndc * (1.0 - 0.02 * blurFactor * float(i))));
    }
    color /= float(BLUR_SAMPLES);
  }

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>

  // vignette in gamma space to match the reference's look
  float r = length(ndc);
  float vignette = smoothstep(VIGNETTE_RADIUS, VIGNETTE_RADIUS - VIGNETTE_SOFTNESS, r);
  gl_FragColor.rgb *= mix(1.0 - VIGNETTE_INTENSITY, 1.0, vignette);
  gl_FragColor.rgb *= 1.0 - smoothstep(1.2, 1.8, r);
}
`
