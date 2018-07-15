import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { Observable, Observer, Subject } from 'rxjs';
import { RGB, TrainingProcess, TrainingStage } from './light-or-dark.service';

export interface TrainingData {
  backgroundColor: RGB;
  alertColor: RGB;
  output: RGB;
}

@Injectable()
export class AlertColorService {
  private model: tf.Sequential;
  private learningRate = 0.1;
  private training$: Subject<TrainingProcess> = new Subject();

  public async load() {
    this.model = tf.sequential();
    this.model.add(
      tf.layers.dense({
        units: 3,
        inputDim: 6,
        useBias: true,
        // inputShape: [2 , 3],
        activation: 'sigmoid',
      }),
    );
    this.model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 3 }));
    // }

    const modelOptimizer = tf.train.sgd(this.learningRate);
    this.model.compile({
      loss: 'meanSquaredError',
      optimizer: modelOptimizer,
    });
  }

  public guess(backgroundColor: RGB, alertColor: RGB): Observable<RGB> {
    // const xs = tf.tensor3d([
    //   [
    //     [
    //       this.mapFromRbg(backgroundColor.r),
    //       this.mapFromRbg(backgroundColor.g),
    //       this.mapFromRbg(backgroundColor.b),
    //     ],
    //   ],
    //   [
    //     [
    //       this.mapFromRbg(alertColor.r),
    //       this.mapFromRbg(alertColor.g),
    //       this.mapFromRbg(alertColor.b),
    //     ],
    //   ],
    // ]);
    // const xs = tf.tensor2d([
    //   [
    //     this.mapFromRbg(backgroundColor.r),
    //     this.mapFromRbg(backgroundColor.g),
    //     this.mapFromRbg(backgroundColor.b),
    //   ],
    //   [
    //     this.mapFromRbg(alertColor.r),
    //     this.mapFromRbg(alertColor.g),
    //     this.mapFromRbg(alertColor.b),
    //   ],
    // ]);

    // const xs = tf.tensor3d(
    //   [
    //     this.mapFromRbg(backgroundColor.r),
    //     this.mapFromRbg(backgroundColor.g),
    //     this.mapFromRbg(backgroundColor.b),
    //   ],
    //   [
    //     this.mapFromRbg(alertColor.r),
    //     this.mapFromRbg(alertColor.g),
    //     this.mapFromRbg(alertColor.b),
    //   ],
    // );

    const xs = tf.tensor2d([
      [
        this.mapFromRbg(backgroundColor.r),
        this.mapFromRbg(backgroundColor.g),
        this.mapFromRbg(backgroundColor.b),
        this.mapFromRbg(alertColor.r),
        this.mapFromRbg(alertColor.g),
        this.mapFromRbg(alertColor.b),
      ],
    ]);

    xs.print();

    const results = this.model.predict(xs) as tf.Tensor;

    return Observable.create((observer: Observer<RGB>) => {
      results
        // .argMax(1)
        .data()
        .then(x => {
          console.log('innerguess', x);
          // debugger;
          observer.next({
            r: Math.round(this.mapToRbg(x[0])),
            g: Math.round(this.mapToRbg(x[1])),
            b: Math.round(this.mapToRbg(x[2])),
          });
          // xs.dispose();
          // results.dispose();
        })
        .catch(err => {
          observer.error(err);
          // xs.dispose();
          // results.dispose();
        });
    });
  }

  public training(): Observable<TrainingProcess> {
    return this.training$.asObservable();
  }

  public train(epochs: number, trainData: TrainingData[]): Observable<void> {
    if (trainData.length === 0) {
      return;
    }

    console.log('training', trainData.length, { trainData });

    // tf.tidy(() => {
    const colors = trainData.map(x => {
      return [
        this.mapFromRbg(x.backgroundColor.r),
        this.mapFromRbg(x.backgroundColor.g),
        this.mapFromRbg(x.backgroundColor.b),
        this.mapFromRbg(x.alertColor.r),
        this.mapFromRbg(x.alertColor.g),
        this.mapFromRbg(x.alertColor.b),
      ];
    });

    // const colors = trainData.map(x => {
    //     return [
    //       [
    //         this.mapFromRbg(x.backgroundColor.r),
    //         this.mapFromRbg(x.backgroundColor.g),
    //         this.mapFromRbg(x.backgroundColor.b),
    //       ],
    //       [
    //         this.mapFromRbg(x.alertColor.r),
    //         this.mapFromRbg(x.alertColor.g),
    //         this.mapFromRbg(x.alertColor.b),
    //       ],
    //     ];
    //   });

    const labels = trainData.map(x => {
      return [
        this.mapFromRbg(x.output.r),
        this.mapFromRbg(x.output.g),
        this.mapFromRbg(x.output.b),
      ];
    });

    const xs = tf.tensor2d(colors);

    const ys = tf.tensor2d(labels);

    const configCallbacks: tf.CustomCallbackConfig = {
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        // console.log('onEpochEnd', epoch, logs.loss);
        this.training$.next({
          stage: TrainingStage.InProcess,
          loss: logs.loss,
        });
        return Promise.resolve();
      },
    };

    const config: tf.ModelFitConfig = {
      epochs,
      shuffle: true,
      callbacks: configCallbacks,
    };

    return Observable.create((observer: Observer<void>) => {
      this.model.fit(xs, ys, config).then(x => {
        observer.next(undefined);
        observer.complete();
      });
    });
  }

  public async save() {
    await this.model.save('downloads://light-or-dark-model');
    // await this.model.save('localstorage://light-or-dark-model');
  }

  public mapFromRbg(input: number) {
    return this.map(input, 0, 255, -1, 1);
    // return input;
  }

  public mapToRbg(input: number) {
    return this.map(input, -1, 1, 0, 255);
  }

  private map(
    input: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number,
  ): number {
    return (
      ((input - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
    );
  }
}
