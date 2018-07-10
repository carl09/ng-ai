import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LightOrDarkComponent } from './light-or-dark/light-or-dark.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { LightOrDarkService } from './services/light-or-dark.service';

@NgModule({
  declarations: [
    AppComponent,
    LightOrDarkComponent,
    ColorPickerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    LightOrDarkService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
