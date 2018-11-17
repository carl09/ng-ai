// import * as tf from '@tensorflow/tfjs';

const window = self;

importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.12.5');

function createAndTrain() {
  tf.setBackend('cpu');

  // importScripts('@tensorflow/tfjs');

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 8, inputDim: 3, activation: 'sigmoid' }));
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

  const modelOptimizer = tf.train.sgd(this.learningRate);
  model.compile({
    loss: 'categoricalCrossentropy',
    optimizer: modelOptimizer,
  });

  const data = localStorage.getItem('trainData');

  const trainData = JSON.parse(data) || [];

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

  const configCallbacks = {
    onTrainBegin: () => {
      console.log('onTrainBegin');
      return Promise.resolve();
    },
    onTrainEnd: () => {
      console.log('onTrainEnd');
      return Promise.resolve();
    },
    onEpochEnd: (epoch, logs) => {
      console.log('onEpochEnd', epoch, logs.loss);
      return Promise.resolve();
    },
  };

  const config = {
    epochs: 1000,
    shuffle: true,
    callbacks: configCallbacks,
  };

  model.fit(xs, ys, config).then(x => {
    ctx.postMessage('I am a worker!');
  });
}

function _defineProperty(obj, key, value) {
  return key in obj
    ? Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    : (obj[key] = value);
}

function _objectSpread(target) {
  for (let i = 1; i < arguments.length; i += 1) {
    const source = arguments[i] != null ? arguments[i] : {};
    let ownKeys = Object.keys(source);
    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(
        Object.getOwnPropertySymbols(source).filter(
          sym => Object.getOwnPropertyDescriptor(source, sym).enumerable,
        ),
      );
    }
    ownKeys.forEach(key => _defineProperty(target, key, source[key]));
  }
  return target;
}

createAndTrain();
