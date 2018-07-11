import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { Observable, Subject } from 'rxjs';
import { Observer } from 'rxjs/internal/types';

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

  constructor() {
    // const worker = new Worker('assets/light-or-dark.worker.js')
    // // const worker = new Worker();
    // worker.onmessage = event => {
    //   console.log('help');
    // };
  }

  public async load() {
    // const loadedModel = await tf.loadModel('localstorage://my-model-1');

    this.model = tf.sequential();
    this.model.add(
      tf.layers.dense({ units: 8, inputDim: 3, activation: 'sigmoid' }),
    );
    this.model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

    const modelOptimizer = tf.train.sgd(this.learningRate);
    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: modelOptimizer,
    });
  }

  public guess(color: RGB): Observable<boolean> {
    const xs = tf.tensor2d([[color.r, color.g, color.b]]);

    const results = this.model.predict(xs) as tf.Tensor;

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

  public train(epochs: number, trainData: TrainingData[]): Observable<void> {
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

    const configCallbacks: tf.CustomCallbackConfig = {
      onTrainBegin: tf.nextFrame,
      // onTrainBegin: () => {
      //   console.log('onTrainBegin');
      //   return Promise.resolve();
      // },
      onTrainEnd: tf.nextFrame,
      // onTrainEnd: () => {
      //   console.log('onTrainEnd');
      //   return Promise.resolve();
      // },
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
}

function fn2workerURL(fn) {
  // const blob = new Blob(['(' + fn.toString() + ')()'], {
  //   type: 'application/javascript',
  // });
  // return URL.createObjectURL(blob);
  return URL.createObjectURL(new Blob([fn.toString()]));
}
