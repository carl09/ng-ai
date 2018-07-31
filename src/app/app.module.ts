import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AlertColorComponent } from './alert-color/alert-color.component';
import { AlertComponent } from './alert-color/alert/alert.component';
import { AppComponent } from './app.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { ForcastingComponent } from './forcasting/forcasting.component';
import { LightOrDarkComponent } from './light-or-dark/light-or-dark.component';
import { SentimentComponent } from './sentiment/sentiment.component';
import { AlertColorService } from './services/alert-color.service';
import { LightOrDarkService } from './services/light-or-dark.service';
import { StockPriceComponent } from './stock-price/stock-price.component';
import { WidgetGuessComponent } from './widget-guess/widget-guess.component';

@NgModule({
  declarations: [
    AppComponent,
    LightOrDarkComponent,
    ColorPickerComponent,
    AlertColorComponent,
    AlertComponent,
    SentimentComponent,
    WidgetGuessComponent,
    StockPriceComponent,
    ForcastingComponent,
  ],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule],
  providers: [LightOrDarkService, AlertColorService],
  bootstrap: [AppComponent],
})
export class AppModule {}
