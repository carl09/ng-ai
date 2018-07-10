import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { ModelFitConfig, CustomCallbackConfig, Logs, Tensor } from '@tensorflow/tfjs';
import { Observer } from 'rxjs/internal/types';
import { Subject, Observable } from 'rxjs';

export interface TrainingData {
  input: RGB;
  output?: {
    light?: number;
    dark?: number;
  };
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export enum TrainingStage {
  InProcess,
  Compleated,
}

export interface TrainingProcess {
  stage: TrainingStage;
  loss: number;
}

@Injectable()
export class LightOrDarkService {
  private model: tf.Sequential;
  private learningRate = 0.1;
  private training$: Subject<TrainingProcess> = new Subject();

  public load() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 8, inputDim: 3, activation: 'sigmoid' }));
    this.model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

    const optimizer = tf.train.sgd(this.learningRate);
    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: optimizer,
    });
  }

  public guess(color: RGB): Observable<boolean> {
    const xs = tf.tensor2d([[color.r, color.g, color.b]]);

    const results = this.model.predict(xs) as Tensor;

    return Observable.create((observer: Observer<boolean>) => {
      results
        .argMax(1)
        .data()
        .then(x => {
          observer.next(x[0] === 1);
          xs.dispose();
          results.dispose();
        })
        .catch(err => {
          observer.error(err);
          xs.dispose();
          results.dispose();
        });
    });
  }

  public training(): Observable<TrainingProcess> {
    return this.training$.asObservable();
  }

  public train(trainData: TrainingData[]): Observable<void> {
    if (trainData.length === 0) {
      return;
    }

    console.log('training', trainData.length, { trainData });

    // tf.tidy(() => {
    const colors = trainData.map(x => {
      return [x.input.r, x.input.g, x.input.r];
    });

    const labels = trainData.map(x => {
      return x.output.dark ? 0 : 1;
    });

    const xs = tf.tensor2d(colors);

    const labels_ts = tf.tensor1d(labels, 'int32');

    const ys = tf.oneHot(labels_ts, 2);

    labels_ts.dispose();

    const config: ModelFitConfig = {
      epochs: 100,
      shuffle: true,
      callbacks: {
        onTrainBegin: () => {
          console.log('onTrainBegin');
        },
        onTrainEnd: () => {
          console.log('onTrainEnd');
        },
        onEpochEnd: (epoch: number, logs: Logs) => {
          // console.log('onEpochEnd', epoch, logs.loss);
          this.training$.next({
            stage: TrainingStage.InProcess,
            loss: logs.loss,
          });
        },
      } as CustomCallbackConfig,
    };

    return Observable.create((observer: Observer<void>) => {
      this.model.fit(xs, ys, config).then(x => {
        observer.next(undefined);
        observer.complete();
      });
    });
  }
}
