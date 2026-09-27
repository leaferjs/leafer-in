import { IImageFilter, IImageFilters, IObject } from '@leafer-ui/interface'


export interface IUserFilter {
    name: string
    shader?: string
    type?: 'linear' | 'nonlinear'
}

interface IImageFilterMap {
    [name: string]: IUserFilter
}

const filterMap: IImageFilterMap = {}

export function registerImageFilter(name: string, shader: string, _options?: IObject) {
    filterMap[name] = { name, shader }
}

// WebGL Helpers

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, src)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:\n', gl.getShaderInfoLog(shader), src)
    }

    return shader
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
    const program = gl.createProgram()!

    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vs))
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fs))

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program))
    }

    return program
}

// Vertex Shader

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main(){
    gl_Position = vec4(a_position,0.0,1.0);
    v_texCoord = a_texCoord;
}
`

// Filter Functions (JS变量，可替换)

const commonFunctions = `
float luminance(vec3 c){
    return dot(c,vec3(0.2126,0.7152,0.0722));
}
`

registerImageFilter('exposure', `
vec3 exposure(vec3 c,float v,vec2 uv,vec2 resolution){
    return clamp(c * pow(2.0,v),0.0,1.0);
}`)

registerImageFilter('contrast', `
vec3 contrast(vec3 c,float v,vec2 uv,vec2 resolution){
    return clamp((c-0.5)*(1.0+v)+0.5,0.0,1.0);
}`)

registerImageFilter('saturation', `
vec3 saturation(vec3 c,float v,vec2 uv,vec2 resolution){
    float l = luminance(c);
    return clamp(mix(vec3(l),c,1.0+v),0.0,1.0);
}`)

registerImageFilter('temperature', `
vec3 temperature(vec3 c,float v,vec2 uv,vec2 resolution){
    float f = clamp(v, -1.0, 1.0);
    vec3 result = c;
    result.r += f * 0.1; // 暖色增加红
    result.b -= f * 0.1; // 冷色增加蓝（负值时自动增加蓝）
    return clamp(result, 0.0, 1.0);
}`)

registerImageFilter('tint', `
float hue2rgb(float p, float q, float t){
    if(t < 0.0) t += 1.0;
    if(t > 1.0) t -= 1.0;
    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if(t < 1.0/2.0) return q;
    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 rgb2hsl(vec3 c){
    float maxC = max(max(c.r, c.g), c.b);
    float minC = min(min(c.r, c.g), c.b);
    float h = 0.0;
    float s = 0.0;
    float l = (maxC + minC) * 0.5;
    if(maxC != minC){
        float d = maxC - minC;
        s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
        if(maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
        else if(maxC == c.g) h = (c.b - c.r) / d + 2.0;
        else h = (c.r - c.g) / d + 4.0;
        h /= 6.0;
    }
    return vec3(h, s, l);
}

vec3 hsl2rgb(vec3 hsl){
    float r;
    float g;
    float b;
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    if(s == 0.0){
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }
    return vec3(r, g, b);
}

vec3 tint(vec3 c,float v,vec2 uv,vec2 resolution){
    float shift = -clamp(v, -1.0, 1.0) * 60.0 / 360.0; // ±60°
    vec3 hsl = rgb2hsl(c);
    hsl.x = mod(hsl.x + shift, 1.0);
    return hsl2rgb(hsl);
}`)

registerImageFilter('highlights', `
vec3 highlights(vec3 c,float v,vec2 uv,vec2 resolution){
    float l = 0.2126*c.r + 0.7152*c.g + 0.0722*c.b;
    float factor = pow(smoothstep(0.5, 1.0, l), 1.2) * v;
    return clamp(c + factor, 0.0, 1.0);
}`)


registerImageFilter('shadows', `
vec3 shadows(vec3 c, float v, vec2 uv, vec2 resolution) {
    // v 范围: -1.0 (压暗暗部) 到 1.0 (提亮暗部)
    float brightness = luminance(c);

    // 计算阴影权重 (亮度 < 0.5 的区域)
    float shadowWeight = 1.0 - smoothstep(0.0, 0.5, brightness);

    // 调整因子: 正值提亮，负值压暗
    float factor = 1.0 + v * shadowWeight * 0.5;

    return clamp(c * factor, 0.0, 1.0);
}`)


//  Fragment Shader Builder

function buildFragmentShader(filters: IImageFilter[]) {
    const uniforms = filters.map((f) => `uniform float u_${f.type};`).join('\n')

    const filterCode = filters
        .map((f) => `c = ${f.type}(c,u_${f.type},v_texCoord,u_resolution);`)
        .join('\n')

    // 组装shader
    const shaders = filters.map(item => filterMap[item.type].shader)

    const shaderParts = [
        `precision mediump float;`,

        `uniform sampler2D u_image;`,
        `uniform vec2 u_resolution;`,

        uniforms,

        `varying vec2 v_texCoord;`,

        commonFunctions,

        shaders.join('\n'),

        `void main(){`,
        `vec4 color = texture2D(u_image,v_texCoord);`,
        `vec3 c = color.rgb;`,

        filterCode,

        `gl_FragColor = vec4(c,color.a);`,
        `}`,
    ]

    return shaderParts.join('\n')
}

// Apply Filter

export function applyFilter(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    filters: IImageFilters
) {
    const gl = canvas.getContext('webgl')

    if (!gl) {
        console.error('WebGL not supported')
        return
    }

    attachSafeClose(canvas) // 绑定close销毁方法

    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.clearColor(1, 1, 1, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const activeFilters = filters.some(item => {
        const hasFilter = filterMap[item.type]
        if (!hasFilter) console.warn('filter not exist:', item)
        return !item.value || !hasFilter
    }) ? filters.filter(item => item.value && filterMap[item.type]) : filters

    const fs = buildFragmentShader(activeFilters)

    const program = createProgram(gl, vertexShaderSource, fs)

    gl.useProgram(program)

    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    // 修改顶点数据：交换纹理坐标的 Y 值 (0 变 1, 1 变 0)
    // 结构：[x, y, u, v]
    const vertices = new Float32Array([
        -1, -1, 0, 1,  // 左下
        1, -1, 1, 1,  // 右下
        -1, 1, 0, 0,  // 左上
        -1, 1, 0, 0,  // 左上 (重复)
        1, -1, 1, 1,  // 右下 (重复)
        1, 1, 1, 0,  // 右上
    ])

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'a_position')
    const texLoc = gl.getAttribLocation(program, 'a_texCoord')

    if (posLoc >= 0) {
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0)
    }

    if (texLoc >= 0) {
        gl.enableVertexAttribArray(texLoc)
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8)
    }

    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0) // ImageBitmap 会翻转

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    const resLoc = gl.getUniformLocation(program, 'u_resolution')
    if (resLoc !== null) gl.uniform2f(resLoc, canvas.width, canvas.height)

    activeFilters.forEach((f) => {
        const loc = gl.getUniformLocation(program, `u_${f.type}`)
        if (loc !== null) gl.uniform1f(loc, f.value)
    })

    gl.drawArrays(gl.TRIANGLES, 0, 6)
}


export function attachSafeClose(canvas: HTMLCanvasElement) {
    if ((canvas as any).close) return;  // 避免重复卸载

    (canvas as any).close = function () {
        const gl = this.getContext('webgl') as WebGLRenderingContext | null

        if (gl) {
            gl.useProgram(null)
            gl.bindTexture(gl.TEXTURE_2D, null)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            const loseContextExt = gl.getExtension('WEBGL_lose_context')
            if (loseContextExt) {
                loseContextExt.loseContext()
            }
        }

    }
}