export interface irojs {
    ColorPicker: ColorPicker;
    Color: Color;
}

interface ColorPicker {
    new (ele: string, options?: ColorPickerOptions): ColorPickerInstance;
}

interface ColorPickerOptions {
    width?: number;
    height?: number;
    color?: hsv | hsl | rgb | string;
    padding?: number;
    sliderMargin?: number;
    sliderHeight?: number;
    wheelLightness?: number;
    markerRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    display?: string;
    anticlockwise?: boolean;
    css?: any;
}

interface Color {
    hsv: hsv;
    hsl: hsl;
    rgb: rgb;
    rgbString: string;
    hslString: string;
    hexString: string;

    new (value: hsv | hsl | rgb | string): Color;
    set(value: hsv | hsl | rgb): void;

    _onChange(value: any);
    forceUpdate();

    //static parseHexStr(value: string) : rgb;
    parseHexStr(value: string): rgb;
}

interface hsv {
    h: number;
    s: number;
    v: number;
}

interface hsl {
    h: number;
    s: number;
    l: number;
}

interface rgb {
    r: number;
    g: number;
    b: number;
}

export interface ColorPickerInstance {
    on(eventType: 'color:change', listener: (color: Color, v: any) => void);
    off(eventType: 'color:change', listener: (color: Color, v: any) => void);

    on(eventType: 'input:end', listener: (color: Color, v: any) => void);
    off(eventType: 'input:end', listener: (color: Color, v: any) => void);

    on(eventType: 'mount', listener: (colorPickerInstance: ColorPickerInstance) => void);
    off(eventType: 'mount', listener: (colorPickerInstance: ColorPickerInstance) => void);

    color: Color;
}
