import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Color, ColorPickerInstance, irojs, rgb } from './iro';

import 'core-js/fn/string/pad-start';

declare const require: any;

// tslint:disable-next-line:no-var-requires
const iro: irojs = require('@jaames/iro');

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./_color-picker.component.scss'],
})
export class ColorPickerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public color: string;

  // tslint:disable-next-line:no-output-named-after-standard-event
  @Output() public readonly change = new EventEmitter<string>();

  @ViewChild('colorPickerContainer') public colorPickerContainer: ElementRef;

  public lastColor: string;

  private colorPickerInstance: ColorPickerInstance;

  private isActive = false;

  public ngOnInit() {
    const inputColor = this.color ? this.color : '#ccc';

    const c = new iro.Color(inputColor);

    this.colorPickerInstance = new iro.ColorPicker(this.colorPickerContainer.nativeElement, {
      color: c.hsl,
      width: 200,
      height: 200,
      padding: 0,
    });

    this.lastColor = c.hexString;

    this.colorPickerInstance.on('mount', () => this.setColorPickerActive());
    this.colorPickerInstance.on('input:end', color => this.updateColor(color));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.color.currentValue) {
        const color = new iro.Color(changes.color.currentValue);
      this.colorPickerInstance.color.set(color.rgb);
    }
  }

  public ngOnDestroy() {
    this.colorPickerInstance.off('input:end', color => this.updateColor(color));
    this.colorPickerInstance.off('mount', () => this.setColorPickerActive());
  }

  public setColor(event: KeyboardEvent) {
    const value = (event.target as HTMLInputElement).value;
    const c = iro.Color.parseHexStr(value); // ('#ff0');

    this.updateColorManual(c, value);
  }

  public pasteColor(event: ClipboardEvent) {
    const value = event.clipboardData.getData('Text');
    const c = iro.Color.parseHexStr(value);

    this.updateColorManual(c, value);
  }

  private updateColorManual(c: rgb, _inputValue: string) {
    const color = new iro.Color(c);
    this.setInput(c);
    this.change.emit(color.hexString);
  }

  private updateColor(color: Color) {
    this.change.emit(color.hexString);
    this.lastColor = color.hexString;
    this.setInput(color.rgb);
  }

  private setColorPickerActive() {
    this.isActive = true;
  }

  private setInput(color: rgb) {
    if (this.isActive) {
      this.colorPickerInstance.color.set(color);
    }
  }
}
