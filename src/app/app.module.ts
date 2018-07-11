import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { LightOrDarkComponent } from './light-or-dark/light-or-dark.component';
import { LightOrDarkService } from './services/light-or-dark.service';

@NgModule({
  declarations: [AppComponent, LightOrDarkComponent, ColorPickerComponent],
  imports: [BrowserModule],
  providers: [LightOrDarkService],
  bootstrap: [AppComponent],
})
export class AppModule {}
