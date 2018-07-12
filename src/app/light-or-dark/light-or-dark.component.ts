import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  LightOrDarkService,
  RGB,
  TrainingData,
  TrainingProcess,
} from '../services/light-or-dark.service';

import * as tinycolor_ from 'tinycolor2';
const tinycolor: tinycolor = (tinycolor_ as any).default || tinycolor_;

@Component({
  selector: 'app-light-or-dark',
  templateUrl: './light-or-dark.component.html',
  styleUrls: ['./light-or-dark.component.css'],
})
export class LightOrDarkComponent implements OnInit {
  public color: string;
  public colorCode: RGB;
  public guessLabel: string;

  public newColor: string;

  public status$: Observable<TrainingProcess>;

  private trainData: TrainingData[] = [];

  constructor(private lightOrDarkService: LightOrDarkService) {}

  ngOnInit() {
    this.status$ = this.lightOrDarkService.training();

    this.lightOrDarkService.load().then(() => {
      const data = localStorage.getItem('trainData');
      if (data) {
        this.trainData = JSON.parse(data) || [];
        this.lightOrDarkService
          .train(10, this.trainData)
          .pipe(take(1))
          .subscribe(() => {
            this.newColor = this.getRandomRgb();
            this.colorChanged(this.newColor);
          });
      }
    });
  }

  public colorChanged($event: any) {
    this.color = undefined;

    const rgb = tinycolor($event).toRgb();

    console.log('colorChanged', rgb);

    this.lightOrDarkService
      .guess(rgb)
      .pipe(take(1))
      .subscribe(x => {
        if (x) {
          this.guessLabel = 'white';
          console.log('light');
        } else {
          this.guessLabel = 'black';
          console.log('dark');
        }
      });

    this.color = $event;
    this.colorCode = rgb;
  }

  public updateAI(rgb: RGB, isLight: boolean) {
    const data: TrainingData = {
      input: rgb,
      output: {},
    };

    data.output.light = isLight ? 1 : 0;
    data.output.dark = isLight ? 0 : 1;

    console.log({ data });
    this.trainData.push(data);
    this.lightOrDarkService
      .train(10, this.trainData)
      .pipe(take(1))
      .subscribe(() => {
        localStorage.setItem('trainData', JSON.stringify(this.trainData));
        this.newColor = tinycolor.random().toHexString();
        this.colorChanged(this.newColor);
      });
  }

  public saveModel() {
    this.lightOrDarkService.save();
  }

  private getRandomRgb() {
    return tinycolor.random().toHexString();
  }
}
