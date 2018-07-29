import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as tinycolor from 'tinycolor2';
import { RGB, TrainingData } from './light-or-dark.service';

@Injectable()
export class LightOrDarkService2 {
  private model: tf.Sequential;
  private learningRate = 0.1;

  public async load() {
    this.model = tf.sequential();
    this.model.add(
      tf.layers.conv1d({
        inputShape: [3, 3],
        kernelSize: 3,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      }),
    );

    // this.model.add(tf.layers.maxPool1d({
    //   poolSize: 2,
    //   strides: 2
    // }));

    this.model.add(tf.layers.flatten());

    // this.model.add(tf.layers.dense({units: 4, activation: 'relu'}));

    this.model.add(
      tf.layers.dense({ units: 2, activation: 'softmax', name: 'dense1' }),
    );

    const modelOptimizer = tf.train.adam(this.learningRate); // sgd(this.learningRate);

    this.model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: modelOptimizer,
      metrics: ['accuracy'],
    });

    this.model.summary();
  }

  public async guess(color: RGB) {
    console.log('guess');
    const xs = tf.tensor3d([
      [
        [this.mapFromRbg(color.r), 0, 0],
        [0, this.mapFromRbg(color.g), 0],
        [0, 0, this.mapFromRbg(color.r)],
      ],
    ]);

    const results = this.model.predict(xs) as tf.Tensor;

    const data = await results.argMax(1).data();

    return data[0] === 1;
  }

  public async guessList(color: string[]): Promise<number[]> {
    console.log('guessList');
    const xs = tf.tensor3d(
      color.map(x => {
        const c = tinycolor(x).toRgb();
        return [
          [this.mapFromRbg(c.r), 0, 0],
          [0, this.mapFromRbg(c.g), 0],
          [0, 0, this.mapFromRbg(c.r)],
        ];
      }),
    );

    xs.print();
    console.log(xs.shape);

    const results = this.model.predict(xs) as tf.Tensor;

    const data = await results.argMax(1).data();

    const out: number[] = [];
    (data as Int32Array).forEach(x => {
      out.push(x);
    });

    return Promise.resolve(out);
  }

  public async train(
    epochs: number,
    trainData: TrainingData[],
    callback: (epoch: number, logs: tf.Logs) => void,
  ) {
    console.log('train');
    if (trainData.length === 0) {
      return;
    }

    // tf.tidy(() => {
    const colors = trainData.map(x => {
      return [
        [this.mapFromRbg(x.input.r), 0, 0],
        [0, this.mapFromRbg(x.input.g), 0],
        [0, 0, this.mapFromRbg(x.input.r)],
      ];
    });

    const labels = trainData.map(x => {
      return x.output.dark ? 0 : 1;
    });

    const xs = tf.tensor3d(colors);

    xs.print();

    const labels_ts = tf.tensor1d(labels, 'int32');

    const ys = tf.oneHot(labels_ts, 2);

    labels_ts.dispose();

    xs.print();
    ys.print();

    const sampleRate = epochs > 10 ? Math.floor(epochs / 10) : 1;

    const configCallbacks: tf.CustomCallbackConfig = {
      onBatchEnd: tf.nextFrame,
      onTrainBegin: tf.nextFrame,
      onTrainEnd: tf.nextFrame,
      onEpochEnd: (epoch: number, logs: tf.Logs) => {
        if (epoch % sampleRate === 0) {
          callback(epoch, logs);
        }
        return Promise.resolve();
      },
    };

    const config: tf.ModelFitConfig = {
      epochs,
      shuffle: true,
      callbacks: configCallbacks,
    };

    return this.model.fit(xs, ys, config);
  }

  public mapFromRbg(input: number) {
    return this.map(input, 0, 255, 0, 1);
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
