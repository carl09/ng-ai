import * as tf from '@tensorflow/tfjs';

export interface IData {
  dates: number[];
  highs: number[];
}

export function print(msg: any) {
  console.log(msg);
  return Promise.resolve();
}

export function prep(data): IData {
  const dates = [];
  const highs = [];

  for (const dd of data) {
    dates.push(new Date(dd['Date'] + 'T00:00:00.000').getTime());
    highs.push(dd['Close']);
  }

  return {
    dates,
    highs,
  };
}

const d = {
  test_times: [
    new Date('1995-12-17T00:00:00.000').getTime(),
    new Date('2018-06-25T00:00:00.000').getTime(),
  ],
  test_highs: [184.160004, 184.919998],
};

export function buildCnn(data: {
  dates: number[];
  highs: number[];
}): { model: tf.Sequential; data: IData } {
  const model = new tf.Sequential();

  console.log('buildCnn.dates', data.dates.length);

  model.add(
    tf.layers.conv1d({
      inputShape: [data.dates.length, 1],
      kernelSize: 100,
      filters: 8,
      strides: 2,
      activation: 'relu',
      kernelInitializer: 'VarianceScaling',
    }),
  );

  model.add(
    tf.layers.maxPooling1d({
      poolSize: 500,
      strides: 2,
    }),
  );

  model.add(
    tf.layers.conv1d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'VarianceScaling',
    }),
  );

  model.add(
    tf.layers.maxPooling1d({
      poolSize: 100,
      strides: 2,
    }),
  );

  model.add(tf.layers.flatten());

  model.add(
    tf.layers.dense({
      units: 1,
      kernelInitializer: 'VarianceScaling',
      activation: 'softmax',
    }),
  );

  return {
    model,
    data,
  };
}

export async function cnn(model: tf.Sequential, data: IData, cycles: number) {
  console.log('cnn.dates', data.dates.length);

  const tdates = tf.tensor2d([data.dates]);
  const thighs = tf.tensor1d(data.highs);
  const test = tf.tensor1d(d.test_times);
  // const out = model.getLayer('dense_Dense1');

  thighs.print();

  const xs = tdates.reshape([1, data.dates.length, 1]);

  const ys = thighs.reshape([data.dates.length, 1]);

  xs.print();

  model.summary();

  model.compile({
    optimizer: 'sgd',
    loss: 'binaryCrossentropy',
    // lr: 0.1,
  });
  await model.fit(xs, thighs, {
    batchSize: 3,
    epochs: cycles,
  });

  print('');
  print('Running CNN for AAPL at ' + cycles + ' epochs');
  print(model.predict(test));
  print(d.test_highs);
  print('');
}
