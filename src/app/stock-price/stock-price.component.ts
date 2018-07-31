import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { buildCnn, cnn, prep } from './stock-price.fuc';

@Component({
  selector: 'app-stock-price',
  templateUrl: './stock-price.component.html',
  preserveWhitespaces: false,
})
export class StockPriceComponent implements OnInit {
  constructor(private httpClient: HttpClient) {}

  public ngOnInit(): void {
    this.httpClient
      .get('http://localhost:4200/assets/AAPL.json')
      .subscribe(data => {
        const built = buildCnn(prep(data));
        cnn(built.model, built.data, 100).then(e => {
          console.log(
            'Completed tests at ' + new Date() + '... thanks for waiting!',
          );
        });
      });

    // })
  }
}
