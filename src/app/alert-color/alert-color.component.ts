import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import * as tinycolor from 'tinycolor2';
import {
  AlertColorService,
  TrainingData,
} from '../services/alert-color.service';
import { TrainingProcess } from '../services/light-or-dark.service';

interface AlertColor {
  defaultColor: string;
  selectedColor: string;
  backgroundColor: string;
}

@Component({
  selector: 'app-alert-color',
  templateUrl: './alert-color.component.html',
  styleUrls: ['./alert-color.component.scss'],
})
export class AlertColorComponent implements OnInit {
  public color: string;
  public colorDanger: string;

  public alertDanger = '#e10d11';

  public contrast: number;

  public colorManage: string;

  public status$: Observable<TrainingProcess>;

  public alerts: AlertColor[] = [];

  private trainData: TrainingData[] = [];

  constructor(private alertColorService: AlertColorService) {
    this.colorDanger = this.alertDanger;
    console.log(this.color);
  }

  public ngOnInit() {
    this.status$ = this.alertColorService.training();

    this.alertColorService.load().then(() => {
      //   const defaults = ['#2070d0' , '#09894e', '#ffcb00', '#e10d11'];

      //   this.trainData = []

      //   for (let index = 0; index < 100; index++) {

      //     const bgColor =  tinycolor.random();
      //     this.color = bgColor.toHexString();

      //     defaults.forEach(x => {
      //       const e: TrainingData = {
      //         alertColor: tinycolor(x).toRgb(),
      //         output: tinycolor(x).lighten(5).toRgb(),
      //         backgroundColor: bgColor.toRgb()
      //       }
      //       this.trainData.push(e);
      //     })
      //   }

      //  //  debugger;

      //   this.alertColorService
      //     .train(100, this.trainData)
      //     .subscribe(() => {
      //           this.genData();
      //         });

      const data = localStorage.getItem('AlertColorComponent');
      if (data) {
        this.trainData = JSON.parse(data) || [];

        this.alertColorService
          .train(200, this.trainData)
          .pipe(take(1))
          .subscribe(() => {
            this.genData();
          });
      } else {
        this.genData();
      }
    });
  }

  public setTraining($event: TrainingData) {
    console.log('setTraining', $event);

    this.trainData.push($event);

    localStorage.setItem('AlertColorComponent', JSON.stringify(this.trainData));
  }

  public train() {
    this.alertColorService
      .train(10, this.trainData)
      .pipe(take(1))
      .subscribe(() => {
        // localStorage.setItem(
        //   'AlertColorComponent',
        //   JSON.stringify(this.trainData),
        // );
        this.genData();
      });
  }

  private genData() {
    const bgColor = tinycolor.random();
    this.color = bgColor.toHexString();

    this.alerts = [];

    const defaults = ['#2070d0', '#09894e', '#ffcb00', '#e10d11'];
    // const defaults = ['#09894e'];

    defaults.forEach(d => {
      const alert = tinycolor(d);

      console.log('pre-guess', bgColor.toRgb(), alert.toRgb());

      this.alertColorService
        .guess(bgColor.toRgb(), alert.toRgb())
        .pipe(take(1))
        .subscribe(x => {
          const co = tinycolor(x).toHexString();

          this.colorDanger = co;
          const row = {
            backgroundColor: this.color,
            selectedColor: co,
            defaultColor: d,
          };
          this.alerts.push(row);

          console.log('guess', row, alert.toHexString());
        });
    });
  }
}
