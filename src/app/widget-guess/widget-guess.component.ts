import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-widget-guess',
  templateUrl: './widget-guess.component.html',
})
export class WidgetGuessComponent {
  public items = [];

  profileForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
  });

  public onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);

    this.items.push({
      description: this.profileForm.value.firstName,
      widget: this.profileForm.value.lastName,
    });

    this.profileForm.reset();
  }
}
