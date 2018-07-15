import { Component, EventEmitter, Input, Output } from '@angular/core';

import * as tinycolor_ from 'tinycolor2';
import { TrainingData } from '../../services/alert-color.service';
const tinycolor: tinycolor = (tinycolor_ as any).default || tinycolor_;

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
})
export class AlertComponent {
  @Input() public selectedColor: string;
  @Input() public defaultColor: string;
  @Input() public backgroundColor: string;

  @Output()
  public readonly updateColor: EventEmitter<TrainingData> = new EventEmitter<
    TrainingData
  >();

  public colorManage: string;
  public contrast: number;

  public manage() {
    this.colorManage = this.defaultColor;

    this.checkColor();
  }

  public setTraining() {
    this.updateColor.emit({
      backgroundColor: tinycolor(this.backgroundColor).toRgb(),
      alertColor: tinycolor(this.defaultColor).toRgb(),
      output: tinycolor(this.colorManage).toRgb(),
    });

    this.colorManage = undefined;
  }

  public cancel() {
    this.colorManage = undefined;
  }

  public lighter() {
    this.colorManage = tinycolor(this.colorManage)
      .lighten(5)
      .toHexString();
    this.checkColor();
  }

  public darker() {
    this.colorManage = tinycolor(this.colorManage)
      .darken(5)
      .toHexString();
    this.checkColor();
  }

  private checkColor() {
    const x = tinycolor.readability(
      tinycolor(this.backgroundColor),
      tinycolor(this.colorManage),
    );
    console.log(x);
    this.contrast = Math.round((x as any) as number);
  }
}
