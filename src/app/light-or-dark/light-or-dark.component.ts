import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import * as tinycolor_ from 'tinycolor2';
import {
  LightOrDarkService,
  RGB,
  TrainingData,
  TrainingProcess,
} from '../services/light-or-dark.service';
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
    this.lightOrDarkService.load();

    this.status$ = this.lightOrDarkService.training();

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
  }

  public colorChanged($event: any) {
    this.color = undefined;

    const rgb = this.getRgb($event);

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
        this.newColor = this.getRandomRgb();
        this.colorChanged(this.newColor);
      });
  }

  public saveModel() {
    this.lightOrDarkService.save();
  }

  private getRandomRgb() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private getRgb(hex): RGB {
    const result = tinycolor(hex).toRgb();

    return result
      ? {
          r: Math.round(result.r / 2.55) / 100,
          g: Math.round(result.g / 2.55) / 100,
          b: Math.round(result.b / 2.55) / 100,
        }
      : null;
  }
}
