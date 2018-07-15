import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AlertColorComponent } from './alert-color/alert-color.component';
import { AlertComponent } from './alert-color/alert/alert.component';
import { AppComponent } from './app.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { LightOrDarkComponent } from './light-or-dark/light-or-dark.component';
import { AlertColorService } from './services/alert-color.service';
import { LightOrDarkService } from './services/light-or-dark.service';

@NgModule({
  declarations: [
    AppComponent,
    LightOrDarkComponent,
    ColorPickerComponent,
    AlertColorComponent,
    AlertComponent,
  ],
  imports: [BrowserModule],
  providers: [LightOrDarkService, AlertColorService],
  bootstrap: [AppComponent],
})
export class AppModule {}
