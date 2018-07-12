import { Component } from '@angular/core';

import * as tinycolor_ from 'tinycolor2';
const tinycolor: tinycolor = (tinycolor_ as any).default || tinycolor_;

@Component({
  selector: 'app-alert-color',
  templateUrl: './alert-color.component.html',
  styleUrls: ['./alert-color.component.scss'],
})
export class AlertColorComponent {
  public color: string;

  constructor() {
    this.color = this.getRandomRgb();
    console.log(this.color);
  }

  private getRandomRgb() {
    return tinycolor.random().toHexString();
  }
}
