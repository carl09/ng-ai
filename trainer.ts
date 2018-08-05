import { ForcastingService, IForcastingItem } from './src/app/forcasting/forcasting.service';

const data = require('./src/assets/forcasting_data.json');

console.log('help');

const service = new ForcastingService();

service.createModel(data).then(() => {
  const training = service.getTraining(data);
  const testing = service.getTesting(data);

  service.train(training, testing, (e, l) => {
    console.log(e, l);
  });
});
